import { json } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import {
  AppProvider,
  Page,
  Layout,
  Text,
  TextField,
  FormLayout,
  Button,
  Card,
  Tabs,
  Banner,
  List
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import shopify from "../shopify.server";

const prisma = new PrismaClient();

// Add !important to every property:value
function addImportantToCSS(css) {
  return css.replace(/([^;{}\n]+)(;)/g, (match, declaration, end) => {
    if (declaration.includes('!important')) return match;
    return declaration.trim() + ' !important' + end;
  });
}

export const loader = async ({ request }) => {
  const { session } = await shopify.authenticate.admin(request);
  const { shop } = session;
  const settings = await prisma.quickViewCss.findUnique({ where: { shop } });
  return json({
    css: settings?.css || ''
  });
};

export const action = async ({ request }) => {
  const { session } = await shopify.authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  let css = formData.get('css') || '';
  css = addImportantToCSS(css);

  try {
    const data = {
      shop,
      css,
    };

    await prisma.quickViewCss.upsert({
      where: { shop },
      update: { ...data, updatedAt: new Date() },
      create: data
    });

    return json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function QuickViewCSSAdmin() {
  const { css } = useLoaderData();
  const actionData = useActionData();

  const [customCSS, setCustomCSS] = useState(css);
  const [success, setSuccess] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (actionData?.success) {
      setSuccess(true);
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const cssGuide = {
    modal: [
      '.quick-view-modal-wrapper - The semi-transparent background overlay.',
      '.quick-view-modal-box - The main container of the modal popup.',
      '.modal-content - The content area within the modal box.',
      '.close - The close (×) button.',
      '.quick-view-modal - The modal container element.',
    ],
    layout: [
      '.quick-view-left-content - The left column (contains images).',
      '.quick-view-right-content - The right column (contains product details).',
      '.quick-view-main-image - The large featured image container.',
      '.quick-view-thumbnails - The container for thumbnail images.',
      '.thumbnail-image - An individual thumbnail image.',
      '.product-image - The main product image.',
    ],
    product: [
      '.quick-view-product-title - The product title link.',
      '.price-wrapper - The container for the price.',
      '#quick-view-price - The current price element.',
      '.compare-at-price - The original (strikethrough) price.',
      '.quick-view-reviews - The container for star ratings and review count.',
      '.quick-view-stars - The star rating element.',
    ],
    forms: [
      '#quick-view-form - The form containing variants and the add-to-cart button.',
      '.variants-dropdown-wrapper - The container for variant dropdowns.',
      '.custom-select-arrow - The variant <select> dropdowns.',
      '.add-to-cart-container - The container for the quantity selector.',
      '.add-to-cart-button - The final "Add to Cart" or "Buy Now" button.',
      '.add-to-cart-actions - The container for add to cart button and view details link.',
      '.view-details - The "View full details" link.',
      '#quick-view-quantity - The quantity input field.',
      '#decrement-qty - The quantity decrease button.',
      '#increment-qty - The quantity increase button.',
      '.quantity-label - The "Quantity:" label.',
    ],
    responsive: [
      '@media (max-width: 800px) - Mobile-specific styles for screens 800px and below.',
      '@media (max-width: 768px) - Tablet-specific styles for screens 768px and below.',
      '@media (max-width: 600px) - Small mobile styles for screens 600px and below.',
      '@media (max-width: 400px) - Extra small mobile styles for screens 400px and below.',
    ],
    utilities: [
      '.quick-view-modal select - All select dropdowns within the modal.',
      '.quick-view-modal .variants-dropdown-wrapper select - Variant dropdowns specifically.',
      '.quick-view-left-content::-webkit-scrollbar - Custom scrollbar for left content.',
      '.quick-view-right-content::-webkit-scrollbar - Custom scrollbar for right content.',
      '.quick-view-right-content::-webkit-scrollbar-thumb - Scrollbar thumb styling.',
    ],
  };

  return (
    <AppProvider i18n={{}}>
      <Page
        title="Quick View Modal Settings"
        primaryAction={{
          content: "Save Settings",
          onAction: () => {
            document.getElementById('quick-view-css-form')?.requestSubmit();
          },
          primary: true
        }}
      >
        <Layout>
          <Layout.Section>
            <Card sectioned>
              {success && (
                <Banner status="success">
                  <p>Settings saved successfully!</p>
                </Banner>
              )}
              {actionData?.error && (
                <Banner status="critical">
                  <p>Error: {actionData.error}</p>
                </Banner>
              )}

              <Tabs tabs={[
                { id: 'settings', content: 'Custom CSS' },
                { id: 'css-guide', content: 'CSS Guide' }
              ]} selected={selectedTab} onSelect={setSelectedTab}>
                {selectedTab === 0 ? (
                  <Form id="quick-view-css-form" method="post">
                    <FormLayout>
                      <Card title="Custom CSS for Quick View" sectioned>
                        <TextField
                          label="Custom CSS"
                          name="css"
                          multiline={24}
                          value={customCSS}
                          onChange={setCustomCSS}
                          autoComplete="off"
                          helpText="Add custom CSS styles for the quick view modal."
                        />
                      </Card>

                      <Button submit primary>
                        Save Settings
                      </Button>
                    </FormLayout>
                  </Form>
                ) : (
                  <Card sectioned>
                    <Text variant="headingMd" as="h2">Quick View CSS Classes Guide</Text>
                    <Text as="p" color="subdued">
                      Use these classes to customize the appearance of your Quick View modal.
                    </Text>

                    {Object.entries(cssGuide).map(([key, items]) => (
                      <div style={{ marginTop: '20px' }} key={key}>
                        <Text variant="headingSm" as="h3">{key.charAt(0).toUpperCase() + key.slice(1)} Classes</Text>
                        <List type="bullet">
                          {items.map((item, index) => (
                            <List.Item key={`${key}-${index}`}>{item}</List.Item>
                          ))}
                        </List>
                      </div>
                    ))}
                  </Card>
                )}
              </Tabs>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
} 