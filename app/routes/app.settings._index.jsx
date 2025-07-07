// app.settings._index.jsx
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Card, Text, List, Button, BlockStack, IndexTable, Tag, Checkbox, Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Query for shop, metafields, and rules
  const response = await admin.graphql(`
    query {
      shop {
        id
        currencyCode
        validationFunctions: metafield(
          namespace: "cart_validation", 
          key: "validation_functions"
        ) { 
          id
          value 
        }
        enabledMetafield: metafield(namespace: "cart_validation", key: "enabled") { value }
      }
    }
  `);

  const data = await response.json();
  const shop = data.data.shop;

  let functions = [];
  try {
    const raw = shop.validationFunctions?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      functions = Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Error parsing functions:", error);
    functions = [];
  }

  // --- New logic: check for rules existence ---
  const funId = "c1650c84-69d5-47ba-ab62-0fb3a8c6e260";
  const payId = "aa5d5876-dd86-4bef-ab76-6dacd623e88b";

  // Query validations
  const validationsResp = await admin.graphql(`
    query {
      validations(first: 100) {
        edges {
          node {
            id
            enabled
            shopifyFunction { id }
          }
        }
      }
    }
  `);
  const validationsJson = await validationsResp.json();
  const validationEdge = validationsJson.data.validations.edges.find(
    edge => edge.node.shopifyFunction.id === funId
  );

  // Query payment customizations
  const paymentCustomizationsResp = await admin.graphql(`
    query {
      paymentCustomizations(first: 10) {
        edges {
          node {
            id
            enabled
            functionId
          }
        }
      }
    }
  `);
  const paymentCustomizationsJson = await paymentCustomizationsResp.json();
  const paymentCustomization = paymentCustomizationsJson.data.paymentCustomizations.edges.find(
    edge => edge.node.functionId === payId
  );

  // Only enabled if metafield is 'true' AND both rules exist and are enabled
  const metafieldEnabled = shop.enabledMetafield?.value === "true";
  const rulesEnabled =
    validationEdge?.node?.enabled === true &&
    paymentCustomization?.node?.enabled === true;
  const enabled = metafieldEnabled && rulesEnabled;

  return json({
    currency: shop.currencyCode,
    functions: functions || [],
    enabled,
    // ... other data
  }, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const functionId = formData.get("functionId");
  const funId = "c1650c84-69d5-47ba-ab62-0fb3a8c6e260";
  const payId = "aa5d5876-dd86-4bef-ab76-6dacd623e88b";

  if (actionType === "toggleEnabled") {
    const enabled = formData.get("enabled") === "true";
    // Save the enabled state to the metafield
    const shopIdResponse = await admin.graphql(`query { shop { id } }`);
    const shopId = (await shopIdResponse.json()).data.shop.id;
    await admin.graphql(`
      mutation {
        metafieldsSet(metafields: [{
          namespace: "cart_validation",
          key: "enabled",
          type: "single_line_text_field",
          value: "${enabled}",
          ownerId: "${shopId}"
        }]) {
          metafields { id }
          userErrors { field message }
        }
      }
    `);
    const checkExistingQuery = `
      query {
        validations(first: 100) {
          edges {
            node {
              id
              title
              enabled
              shopifyFunction {
                id
              }
            }
          }
        }
      }
    `;
    const existingValidations = await admin.graphql(checkExistingQuery);
    const existingValidationsJson = await existingValidations.json();
    const validationEdge = existingValidationsJson.data.validations.edges.find(
      edge => edge.node.shopifyFunction.id === funId
    );

 const paymentCustomizationQuery = `
  query {
  paymentCustomizations(first: 10) {
    edges {
      node {
        id
        title
        enabled
        functionId
      }
    }
  }
}
`;
const paymentCustomizationsResp = await admin.graphql(paymentCustomizationQuery);
const paymentCustomizationsData = await paymentCustomizationsResp.json();
const paymentCustomization = paymentCustomizationsData.data.paymentCustomizations.edges.find(
  edge => edge.node.functionId === payId
);
   
    if (enabled) {
      if (!validationEdge) {
        const createValidationMutation = `
          mutation {
            validationCreate(
              validation: {
                functionId: "${funId}"
                enable: true
                blockOnFailure: true
                title: "MCV-Validation"
              }
            ) {
              validation {
                id
                title
                enabled
                blockOnFailure
              }
              userErrors {
                field
                message
                code
              }
            }
          }
        `;
        await admin.graphql(createValidationMutation);

      } else if (!validationEdge.node.enabled) {
        const enableMutation = `
          mutation {
            validationUpdate(
              id: "${validationEdge.node.id}"
              validation: { enable: true }
            ) {
              validation {
                id
                enabled
              }
              userErrors {
                field
                message
                code
              }
            }
          }
        `;
        await admin.graphql(enableMutation);
      }
      if (!paymentCustomization) {
    // Create new
    const createPaymentCustomizationMutation = `
      mutation {
        paymentCustomizationCreate(paymentCustomization: {
          title: "Hide payment method by cart total",
          enabled: true,
          functionId: "${payId}"
        }) {
          paymentCustomization { id enabled }
          userErrors { message }
        }
      }
    `;
    await admin.graphql(createPaymentCustomizationMutation);
  } else {
    // Enable existing
    const enablePaymentCustomizationMutation = `
      mutation {
        paymentCustomizationUpdate(
          id: "${paymentCustomization.node.id}",
          paymentCustomization: { enabled: true }
        ) {
          paymentCustomization { id enabled }
          userErrors { message }
        }
      }
    `;
    await admin.graphql(enablePaymentCustomizationMutation);
  }
    } else {
      if (validationEdge && validationEdge.node.enabled) {
        const disableMutation = `
          mutation {
            validationUpdate(
              id: "${validationEdge.node.id}"
              validation: { enable: false }
            ) {
              validation {
                id
                enabled
              }
              userErrors {
                field
                message
                code
              }
            }
          }
        `;
        await admin.graphql(disableMutation);
      }
      // Disable if exists
  if (paymentCustomization) {
    const disablePaymentCustomizationMutation = `
      mutation {
        paymentCustomizationUpdate(
          id: "${paymentCustomization.node.id}",
          paymentCustomization: { enabled: false }
        ) {
          paymentCustomization { id enabled }
          userErrors { message }
        }
      }
    `;
    await admin.graphql(disablePaymentCustomizationMutation);
    }
    }
    return json({ enabled });
  }

  if (actionType === "deleteFunction" && functionId) {
    // Get existing functions
    const response = await admin.graphql(`
      query {
        shop {
          id
          validationFunctions: metafield(
            namespace: "cart_validation",
            key: "validation_functions"
          ) { value }
        }
      }
    `);
    const data = await response.json();
    let functions = [];
    try {
      functions = data.data.shop.validationFunctions?.value
        ? JSON.parse(data.data.shop.validationFunctions.value)
        : [];
    } catch (error) {
      console.error("Error parsing functions:", error);
    }
    // Remove the function
    const updatedFunctions = functions.filter(fn => fn.id !== functionId);
    // Save updated functions
    await admin.graphql(`
      mutation {
        metafieldsSet(metafields: [{
          namespace: "cart_validation",
          key: "validation_functions",
          type: "json",
          value: ${JSON.stringify(JSON.stringify(updatedFunctions))},
          ownerId: "${data.data.shop.id}"
        }]) {
          metafields { id }
          userErrors { field message }
        }
      }
    `);
    return json({ success: true });
  }
  return json({ error: "Invalid action" }, { status: 400 });
};

export default function FunctionsList() {
  const loaderData = useLoaderData();
  const functions = Array.isArray(loaderData?.functions) ? loaderData.functions : [];
  const [isEnabled, setIsEnabled] = useState(loaderData.enabled);
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher();
  useEffect(() => {
    if (typeof fetcher.data?.enabled === "boolean") setIsEnabled(fetcher.data.enabled);
    if (fetcher.state === "idle" && fetcher.data) setLoading(false);
  }, [fetcher.data, fetcher.state]);

  const handleToggleEnabled = (checked) => {
    setLoading(true);
    fetcher.submit(
      {
        actionType: "toggleEnabled",
        enabled: checked ? "true" : "false"
      },
      { method: "post" }
    );
  };

  return (
    <div style={{ margin: '32px', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Spinner accessibilityLabel="Loading function" size="large" />
        </div>
      )}
      <Card>
        <BlockStack gap="400">
          {/* Title and Enable Checkout Rule checkbox in one row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text as="h2" variant="headingMd">Validation Functions</Text>
            <Checkbox
              label="Enable Checkout Rule"
              checked={isEnabled}
              onChange={handleToggleEnabled}
              toggle
            />
          </div>

          {functions.length === 0 ? (
            <Text as="p">No functions created yet. Click "Add Function" to create one.</Text>
          ) : (
            <IndexTable
              itemCount={functions.length}
              headings={[
                { title: 'Function Name' },
                { title: 'Status' },
                { title: 'Conditions' },
                { title: 'Actions' }
              ]}
              selectable={false} // Remove the checkbox column
            >
              {functions.map((fn, index) => (
                <IndexTable.Row id={fn.id} key={fn.id} position={index}>
                  <IndexTable.Cell>
                    <Link
                      to={`/app/settings/${fn.id}`}
                      style={{
                        color: '#111827', // black-ish
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: 15,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        padding: 0,
                        minHeight: 0,
                        minWidth: 0,
                        display: 'inline-block',
                        pointerEvents: loading ? 'none' : 'auto',
                      }}
                      onClick={e => {
                        setLoading(true);
                      }}
                    >
                      {fn.title}
                    </Link>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {fn.enabled ? (
                      <span
                        style={{
                          background: '#C6F6D5', // light green
                          color: '#256029', // dark green text
                          borderRadius: 16,
                          padding: '4px 18px',
                          fontWeight: 600,
                          fontSize: 12,
                          display: 'inline-block',
                          minWidth: 70,
                          textAlign: 'center',
                          lineHeight: 1.5,
                        }}
                      >
                        Enabled
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#E5E7EB', // gray-200
                          color: '#374151', // gray-700
                          borderRadius: 16,
                          padding: '4px 18px',
                          fontWeight: 600,
                          fontSize: 12,
                          display: 'inline-block',
                          minWidth: 70,
                          textAlign: 'center',
                          lineHeight: 1.5,
                        }}
                      >
                        Disabled
                      </span>
                    )}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {fn.rules?.length || 0} conditions
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button url={`${fn.id}`} onClick={() => setLoading(true)} disabled={loading}>Edit</Button>
                      <fetcher.Form method="post" style={{ display: 'inline' }}>
                        <input type="hidden" name="actionType" value="deleteFunction" />
                        <input type="hidden" name="functionId" value={fn.id} />
                        <Button
                          tone="critical"
                          onClick={e => {
                            if (!window.confirm('Are you sure you want to delete this function?')) {
                              e.preventDefault();
                            }
                          }}
                          submit
                          size="slim"
                        >
                          Delete
                        </Button>
                      </fetcher.Form>
                    </div>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}

          <Button url="new" primary>
            Add Function
          </Button>
        </BlockStack>
      </Card>
    </div>
  );
}