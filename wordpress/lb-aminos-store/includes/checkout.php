<?php
/**
 * Research-use-only safeguards at checkout.
 */
defined( 'ABSPATH' ) || exit;

function lba_attest_text() {
	$terms  = get_page_by_path( 'terms' );
	$policy = get_page_by_path( 'research-use' );
	$t      = $terms ? '<a href="' . esc_url( get_permalink( $terms ) ) . '" target="_blank">terms</a>' : 'terms';
	$p      = $policy ? '<a href="' . esc_url( get_permalink( $policy ) ) . '" target="_blank">research-use policy</a>' : 'research-use policy';
	return 'I am 21 or older and I\'m buying these products for laboratory research only, not for human or animal use. I agree to the ' . $t . ' and ' . $p . '.';
}

// Replace WooCommerce's generic terms checkbox with ours.
add_filter( 'woocommerce_checkout_show_terms', '__return_false' );

add_action( 'woocommerce_review_order_before_submit', function () {
	echo '<p class="form-row lba-attest validate-required"><label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">';
	echo '<input type="checkbox" class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" name="lba_attest" id="lba_attest" value="1"> ';
	echo '<span>' . wp_kses_post( lba_attest_text() ) . '</span>&nbsp;<abbr class="required" title="required">*</abbr></label></p>';
} );

add_action( 'woocommerce_checkout_process', function () {
	if ( empty( $_POST['lba_attest'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		wc_add_notice( 'Please confirm you are 21+ and buying for laboratory research only.', 'error' );
	}
	$notes = isset( $_POST['order_comments'] ) ? strtolower( sanitize_textarea_field( wp_unslash( $_POST['order_comments'] ) ) ) : ''; // phpcs:ignore
	if ( $notes && preg_match( '/\b(dose|dosing|inject|injection|my body|for me to take|weight loss|lose weight|personal use)\b/', $notes ) ) {
		wc_add_notice( 'We sell for laboratory research only and can\'t accept orders that mention personal or human use. Please remove that from your order notes.', 'error' );
	}
} );

add_action( 'woocommerce_checkout_create_order', function ( $order ) {
	if ( ! empty( $_POST['lba_attest'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$order->update_meta_data( '_lba_attested', current_time( 'mysql' ) );
	}
} );

add_action( 'woocommerce_admin_order_data_after_billing_address', function ( $order ) {
	$when = $order->get_meta( '_lba_attested' );
	echo '<p><strong>Research-use confirmation:</strong> ' . ( $when ? 'Yes, ' . esc_html( $when ) : 'Not recorded' ) . '</p>';
} );

// Reminder above the cart.
add_action( 'woocommerce_before_cart', function () {
	echo '<div class="lba-ruo-note">For laboratory research use only. Not for human or animal use. Bulk and BOGO savings apply automatically below.</div>';
} );
