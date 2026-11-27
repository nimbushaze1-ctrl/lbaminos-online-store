<?php
/**
 * Manual payment methods:
 *  - Zelle / Venmo / Cash App: the order page and email show the handle, exact amount and memo code.
 *  - Card: the owner pastes a Stripe payment link into the order and it's emailed to the customer.
 * Orders wait as "On hold" until the owner marks them Processing (paid).
 */
defined( 'ABSPATH' ) || exit;

add_filter( 'woocommerce_payment_gateways', function ( $gateways ) {
	$gateways[] = 'LBA_Gateway_Wallet';
	$gateways[] = 'LBA_Gateway_Card';
	return $gateways;
} );

abstract class LBA_Manual_Gateway extends WC_Payment_Gateway {

	public function init_basics( $title, $description ) {
		$this->form_fields = array(
			'enabled'     => array( 'title' => 'Enable', 'type' => 'checkbox', 'label' => 'Offer this at checkout', 'default' => 'yes' ),
			'title'       => array( 'title' => 'Title', 'type' => 'text', 'default' => $title ),
			'description' => array( 'title' => 'Description', 'type' => 'textarea', 'default' => $description ),
		);
		$this->init_settings();
		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'thankyou' ) );
		add_action( 'woocommerce_email_before_order_table', array( $this, 'email' ), 10, 3 );
	}

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );
		$this->before_hold( $order );
		$order->update_status( 'on-hold', 'Waiting for manual payment.' );
		wc_reduce_stock_levels( $order_id );
		WC()->cart->empty_cart();
		return array( 'result' => 'success', 'redirect' => $this->get_return_url( $order ) );
	}

	protected function before_hold( $order ) {}

	public function thankyou( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( $order && $order->has_status( 'on-hold' ) ) {
			echo '<section class="lba-pay-box">' . $this->instructions( $order, false ) . '</section>'; // phpcs:ignore -- built from escaped parts
		}
	}

	public function email( $order, $sent_to_admin, $plain_text = false ) {
		if ( $sent_to_admin || $order->get_payment_method() !== $this->id || ! $order->has_status( 'on-hold' ) ) {
			return;
		}
		$html = $this->instructions( $order, true );
		echo $plain_text ? esc_html( wp_strip_all_tags( $html ) ) . "\n\n" : $html; // phpcs:ignore
	}

	abstract protected function instructions( $order, $for_email );

	protected function amount( $order ) {
		return wp_strip_all_tags( wc_price( $order->get_total(), array( 'currency' => $order->get_currency() ) ) );
	}
}

class LBA_Gateway_Wallet extends LBA_Manual_Gateway {

	public function __construct() {
		$this->id                 = 'lba_wallet';
		$this->method_title       = 'Zelle, Venmo or Cash App (LB Aminos)';
		$this->method_description = 'Customer picks Zelle, Venmo or Cash App. They see your handle, the exact amount and a memo code after ordering. Handles are set under LB Aminos in the dashboard.';
		$this->has_fields         = true;
		$this->init_basics( 'Zelle, Venmo or Cash App', 'Pay after you order. We show you exactly what to send and the code to put in the memo.' );
	}

	public function is_available() {
		return parent::is_available() && count( lba_wallets() ) > 0;
	}

	public function payment_fields() {
		echo '<p>' . esc_html( $this->description ) . '</p><div class="lba-wallets">';
		$first = true;
		foreach ( lba_wallets() as $key => $w ) {
			echo '<label class="lba-wallet"><input type="radio" name="lba_wallet" value="' . esc_attr( $key ) . '"' . ( $first ? ' checked' : '' ) . '> <strong>' . esc_html( $w['label'] ) . '</strong> <span>' . esc_html( $w['blurb'] ) . '</span></label>';
			$first = false;
		}
		echo '</div>';
	}

	public function validate_fields() {
		$pick = isset( $_POST['lba_wallet'] ) ? sanitize_key( $_POST['lba_wallet'] ) : ''; // phpcs:ignore
		if ( ! array_key_exists( $pick, lba_wallets() ) ) {
			wc_add_notice( 'Please choose Zelle, Venmo or Cash App.', 'error' );
			return false;
		}
		return true;
	}

	protected function before_hold( $order ) {
		$pick    = isset( $_POST['lba_wallet'] ) ? sanitize_key( $_POST['lba_wallet'] ) : ''; // phpcs:ignore
		$wallets = lba_wallets();
		if ( isset( $wallets[ $pick ] ) ) {
			$order->update_meta_data( '_lba_wallet', $pick );
			$order->set_payment_method_title( $wallets[ $pick ]['label'] );
			$order->save();
		}
	}

	protected function instructions( $order, $for_email ) {
		$wallets = lba_wallets();
		$pick    = $order->get_meta( '_lba_wallet' );
		$w       = isset( $wallets[ $pick ] ) ? $wallets[ $pick ] : reset( $wallets );
		if ( ! $w ) {
			return '';
		}
		$code  = lba_memo_code( $order );
		$name  = ( 'zelle' === $pick && lba_opt( 'zelle_name' ) ) ? ' (shows as ' . esc_html( lba_opt( 'zelle_name' ) ) . ')' : '';
		$style = $for_email ? ' style="border:1px solid #dedbd5;padding:16px;margin:0 0 20px"' : '';
		$out   = '<div' . $style . '>';
		$out  .= '<h2>Next step: send your payment</h2>';
		$out  .= '<table class="lba-pay-table"><tbody>';
		$out  .= '<tr><th>Pay with</th><td>' . esc_html( $w['label'] ) . '</td></tr>';
		$out  .= '<tr><th>Send to</th><td><strong>' . esc_html( $w['handle'] ) . '</strong>' . $name . '</td></tr>';
		$out  .= '<tr><th>Amount</th><td><strong>' . esc_html( $this->amount( $order ) ) . '</strong></td></tr>';
		$out  .= '<tr><th>Memo</th><td><strong>' . esc_html( $code ) . '</strong> (only this code, nothing else)</td></tr>';
		$out  .= '</tbody></table>';
		$out  .= '<p>We confirm payments within ' . esc_html( lba_opt( 'reply_hours' ) ) . ' hours and then text or email you about pickup, delivery or shipping. Questions? Text ' . esc_html( lba_opt( 'phone' ) ) . '.</p>';
		$out  .= '</div>';
		return $out;
	}
}

class LBA_Gateway_Card extends LBA_Manual_Gateway {

	public function __construct() {
		$this->id                 = 'lba_card';
		$this->method_title       = 'Card via Stripe link (LB Aminos)';
		$this->method_description = 'Customer orders now; you open the order, paste a Stripe payment link and click Update. The link is emailed to them automatically.';
		$this->has_fields         = false;
		$this->init_basics( 'Card (secure Stripe link)', 'Place your order and we\'ll text or email you a secure Stripe payment link. We never see your card details.' );
	}

	protected function instructions( $order, $for_email ) {
		$link  = $order->get_meta( '_lba_stripe_link' );
		$style = $for_email ? ' style="border:1px solid #dedbd5;padding:16px;margin:0 0 20px"' : '';
		$out   = '<div' . $style . '><h2>Next step: pay by card</h2>';
		if ( $link ) {
			$out .= '<p>Pay <strong>' . esc_html( $this->amount( $order ) ) . '</strong> securely through Stripe:</p><p><a class="button" href="' . esc_url( $link ) . '">Pay by card</a></p>';
		} else {
			$out .= '<p>We\'ll text or email you a secure Stripe payment link for <strong>' . esc_html( $this->amount( $order ) ) . '</strong> within ' . esc_html( lba_opt( 'reply_hours' ) ) . ' hours. Order code: <strong>' . esc_html( lba_memo_code( $order ) ) . '</strong>.</p>';
		}
		return $out . '</div>';
	}
}

/* ---------- Order screen: memo code + Stripe link box ---------- */

add_action( 'add_meta_boxes', function () {
	$screen = function_exists( 'wc_get_page_screen_id' ) ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';
	add_meta_box( 'lba-payment', 'LB Aminos payment', 'lba_order_box', $screen, 'side', 'high' );
} );

function lba_order_box( $post_or_order ) {
	$order = ( $post_or_order instanceof WC_Order ) ? $post_or_order : wc_get_order( $post_or_order->ID );
	if ( ! $order ) {
		return;
	}
	wp_nonce_field( 'lba_order', 'lba_order_nonce' );
	echo '<p>Memo code: <strong>' . esc_html( lba_memo_code( $order ) ) . '</strong><br>Method: ' . esc_html( $order->get_payment_method_title() ) . '</p>';
	if ( 'lba_card' === $order->get_payment_method() ) {
		echo '<p><label for="lba_stripe_link"><strong>Stripe payment link</strong></label><input type="url" id="lba_stripe_link" name="lba_stripe_link" style="width:100%" placeholder="https://buy.stripe.com/..." value="' . esc_attr( $order->get_meta( '_lba_stripe_link' ) ) . '"></p>';
		echo '<p class="description">Paste the link and click Update/Save. The customer gets it by email right away.</p>';
	}
	echo '<p class="description">When the money arrives, change the order status to <strong>Processing</strong>, then <strong>Completed</strong> once it\'s picked up, delivered or shipped.</p>';
}

add_action( 'woocommerce_process_shop_order_meta', function ( $order_id ) {
	if ( ! isset( $_POST['lba_order_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['lba_order_nonce'] ) ), 'lba_order' ) || ! isset( $_POST['lba_stripe_link'] ) ) {
		return;
	}
	$order = wc_get_order( $order_id );
	$link  = esc_url_raw( wp_unslash( $_POST['lba_stripe_link'] ) ); // phpcs:ignore
	if ( ! $order || $link === $order->get_meta( '_lba_stripe_link' ) ) {
		return;
	}
	$order->update_meta_data( '_lba_stripe_link', $link );
	$order->save();
	if ( $link ) {
		// A customer note triggers WooCommerce's "note added to your order" email.
		$order->add_order_note( 'Here is your secure card payment link for ' . wp_strip_all_tags( wc_price( $order->get_total() ) ) . ': ' . $link, 1 );
	}
}, 50 );

// Customers can also find the card link on their order page.
add_action( 'woocommerce_order_details_before_order_table', function ( $order ) {
	if ( 'lba_card' === $order->get_payment_method() && $order->has_status( 'on-hold' ) && $order->get_meta( '_lba_stripe_link' ) && ! is_wc_endpoint_url( 'order-received' ) ) {
		echo '<p class="lba-pay-box"><a class="button" href="' . esc_url( $order->get_meta( '_lba_stripe_link' ) ) . '">Pay by card</a></p>';
	}
} );
