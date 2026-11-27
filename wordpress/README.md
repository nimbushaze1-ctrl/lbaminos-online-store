# LB Aminos on WordPress

Two pieces, both uploaded from the WordPress dashboard:

- **lb-aminos-theme.zip**: the look (brand colors, fonts, homepage, product pages, 21+ entry screen, footer disclaimers).
- **lb-aminos-store-plugin.zip**: the shop setup. One button adds all 15 compounds with photos, prices and research details, the info and policy pages, pickup / delivery / shipping, bulk pricing and BOGO, Zelle / Venmo / Cash App and card-link payments, and the required "21+ and research only" checkbox at checkout.

You also need the free **WooCommerce** plugin (the shopping cart). It installs from inside WordPress.

## Install (about 10 minutes)

1. Log in to your WordPress dashboard (yoursite.com/wp-admin).
2. **Plugins → Add New** → search **WooCommerce** → Install → Activate. Skip its setup wizard if it opens.
3. **Plugins → Add New → Upload Plugin** → choose `lb-aminos-store-plugin.zip` → Install → Activate.
4. **Appearance → Themes → Add New → Upload Theme** → choose `lb-aminos-theme.zip` → Install → Activate.
5. Click **LB Aminos** in the left menu → **Set up my store**. Done.

## Everyday tasks

- **Change a price or mark something out of stock:** Products → click the product → Price / Inventory → Update.
- **Add a lab report (COA):** Media → Add New → upload the PDF → copy its link. Open the product, paste the link into "Lab report (COA) link" in the Research details box → Update.
- **New order comes in:** WooCommerce → Orders. It shows as **On hold** until you're paid. Each order has a memo code (LB-000123) the customer puts on their Zelle / Venmo / Cash App payment.
  - Card orders: open the order, paste a Stripe payment link in the "LB Aminos payment" box → Update. The customer gets it by email automatically.
  - When the money arrives, set the status to **Processing**. When it's picked up, delivered or shipped, set it to **Completed**.
- **Change your Zelle / Venmo / Cash App, phone, pickup hours, delivery prices, BOGO or bulk pricing:** LB Aminos in the left menu.

## Notes

- Policy pages (terms, privacy, research-use) are template text; have a lawyer look before you rely on them.
- Running "Set up my store" again updates products from the built-in list but won't overwrite pages you've edited.
- Pickup hours are placeholders until you change them.
