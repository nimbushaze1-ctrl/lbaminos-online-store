<?php
/**
 * Plugin Name: LB Aminos Store
 * Description: Sets up the LB Aminos shop on WooCommerce: imports the catalog, adds Zelle / Venmo / Cash App and card-link payments, bulk pricing, local pickup and delivery, and research-use-only safeguards.
 * Version: 1.0.0
 * Author: LB Aminos
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Text Domain: lb-aminos
 * WC requires at least: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'LBA_VERSION', '1.0.0' );
define( 'LBA_FILE', __FILE__ );
define( 'LBA_DIR', plugin_dir_path( __FILE__ ) );
define( 'LBA_URL', plugin_dir_url( __FILE__ ) );

require_once LBA_DIR . 'includes/helpers.php';
require_once LBA_DIR . 'includes/settings.php';
require_once LBA_DIR . 'includes/setup.php';
require_once LBA_DIR . 'includes/product-meta.php';

// WooCommerce-dependent parts load once WooCommerce is ready.
add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	require_once LBA_DIR . 'includes/pricing.php';
	require_once LBA_DIR . 'includes/shipping.php';
	require_once LBA_DIR . 'includes/checkout.php';
	require_once LBA_DIR . 'includes/gateways.php';
}, 20 );

// Declare compatibility with WooCommerce's order storage (HPOS).
add_action( 'before_woocommerce_init', function () {
	if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		// Our payment methods use the classic checkout page, which setup switches to.
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, false );
	}
} );

register_activation_hook( __FILE__, function () {
	add_option( 'lba_needs_setup', 1 );
} );

// Nudge the owner to run setup after activation.
add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) || ! get_option( 'lba_needs_setup' ) ) {
		return;
	}
	if ( isset( $_GET['page'] ) && 'lb-aminos' === $_GET['page'] ) {
		return;
	}
	$url = admin_url( 'admin.php?page=lb-aminos' );
	echo '<div class="notice notice-info"><p><strong>LB Aminos Store is installed.</strong> ';
	if ( ! class_exists( 'WooCommerce' ) ) {
		echo 'WooCommerce will be installed for you. ';
	}
	echo '<a href="' . esc_url( $url ) . '">open LB Aminos settings and click "Set up my store"</a>.</p></div>';
} );
