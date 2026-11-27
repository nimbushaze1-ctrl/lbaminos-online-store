<?php
defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_menu_page( 'LB Aminos', 'LB Aminos', 'manage_options', 'lb-aminos', 'lba_settings_page', 'dashicons-star-filled', 56 );
} );

add_action( 'admin_init', function () {
	register_setting( 'lba', 'lba_settings', array( 'sanitize_callback' => 'lba_sanitize_settings' ) );
} );

function lba_sanitize_settings( $in ) {
	$d   = lba_defaults();
	$out = array();
	foreach ( $d as $k => $v ) {
		if ( in_array( $k, array( 'bulk_on', 'bogo_on', 'age_gate' ), true ) ) {
			$out[ $k ] = empty( $in[ $k ] ) ? 0 : 1;
		} elseif ( is_int( $v ) ) {
			$out[ $k ] = isset( $in[ $k ] ) ? max( 0, (float) $in[ $k ] ) : $v;
		} elseif ( 'pickup_hours' === $k ) {
			$out[ $k ] = isset( $in[ $k ] ) ? sanitize_textarea_field( $in[ $k ] ) : $v;
		} elseif ( 'email' === $k ) {
			$out[ $k ] = isset( $in[ $k ] ) ? sanitize_email( $in[ $k ] ) : $v;
		} else {
			$out[ $k ] = isset( $in[ $k ] ) ? sanitize_text_field( $in[ $k ] ) : $v;
		}
	}
	return $out;
}

function lba_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$woo  = class_exists( 'WooCommerce' );
	$done = get_option( 'lba_setup_done' );
	$f    = function ( $key, $label, $help = '', $type = 'text' ) {
		$val  = lba_opt( $key );
		$name = 'lba_settings[' . $key . ']';
		echo '<tr><th scope="row"><label for="lba-' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 'checkbox' === $type ) {
			echo '<label><input type="checkbox" id="lba-' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="1" ' . checked( 1, (int) $val, false ) . '> ' . esc_html( $help ) . '</label>';
		} elseif ( 'textarea' === $type ) {
			echo '<textarea id="lba-' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" rows="4" class="large-text code">' . esc_textarea( $val ) . '</textarea>';
			if ( $help ) {
				echo '<p class="description">' . esc_html( $help ) . '</p>';
			}
		} else {
			echo '<input type="' . esc_attr( $type ) . '" id="lba-' . esc_attr( $key ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '" class="regular-text"' . ( 'number' === $type ? ' step="0.01" min="0"' : '' ) . '>';
			if ( $help ) {
				echo '<p class="description">' . esc_html( $help ) . '</p>';
			}
		}
		echo '</td></tr>';
	};
	?>
	<div class="wrap">
		<h1>LB Aminos</h1>
		<?php if ( isset( $_GET['lba_error'] ) ) : ?>
			<div class="notice notice-error"><p><strong>Couldn't install WooCommerce automatically.</strong> <?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['lba_error'] ) ) ); ?> You can install it by hand: <a href="<?php echo esc_url( admin_url( 'plugin-install.php?s=woocommerce&tab=search&type=term' ) ); ?>">Plugins &rarr; Add New</a>, search WooCommerce, Install, Activate, then come back here.</p></div>
		<?php endif; ?>
		<?php if ( isset( $_GET['lba_setup'] ) ) : ?>
			<div class="notice notice-success"><p><strong>Store set up.</strong> <?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['lba_setup'] ) ) ); ?></p></div>
		<?php endif; ?>

		<div style="background:#fff;border:1px solid #dcdcde;padding:16px 20px;margin:16px 0;max-width:820px">
			<h2 style="margin-top:0">1. Set up the store</h2>
			<?php if ( ! $woo ) : ?>
				<p>One click installs <strong>WooCommerce</strong> (the free shopping-cart plugin) and then sets up everything below. It takes about a minute.</p>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="lba_install_woo">
					<?php wp_nonce_field( 'lba_install_woo' ); ?>
					<?php submit_button( 'Install WooCommerce and set up my store', 'primary', 'submit', false ); ?>
				</form>
			<?php else : ?>
				<p>This adds all compounds with photos, prices and research details, creates the shop, policy and info pages, sets up pickup, delivery and shipping, and turns on Zelle / Venmo / Cash App and card-link payments. Running it again updates products instead of duplicating them.</p>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="lba_setup">
					<?php wp_nonce_field( 'lba_setup' ); ?>
					<?php submit_button( $done ? 'Run setup again' : 'Set up my store', 'primary', 'submit', false ); ?>
					<?php if ( $done ) : ?>
						<span style="margin-left:10px;color:#00a32a">&#10003; Last run <?php echo esc_html( $done ); ?></span>
					<?php endif; ?>
				</form>
			<?php endif; ?>
		</div>

		<form method="post" action="options.php" style="max-width:820px">
			<?php settings_fields( 'lba' ); ?>
			<h2>2. Payment handles</h2>
			<p>Shown to customers after they place an order, with the exact amount and the memo code to use. Leave one blank to hide it.</p>
			<table class="form-table">
				<?php
				$f( 'zelle', 'Zelle', 'Phone or email your Zelle is under.' );
				$f( 'zelle_name', 'Name on Zelle', 'The name customers will see in Zelle, so they know they have the right account.' );
				$f( 'venmo', 'Venmo' );
				$f( 'cashapp', 'Cash App' );
				$f( 'reply_hours', 'Reply time (hours)', 'Promised turnaround for card payment links and payment confirmation.', 'number' );
				?>
			</table>
			<h2>3. Contact &amp; pickup</h2>
			<table class="form-table">
				<?php
				$f( 'phone', 'Phone' );
				$f( 'email', 'Email', '', 'email' );
				$f( 'city', 'City' );
				$f( 'pickup_hours', 'Pickup hours', 'One per line: Day | Hours', 'textarea' );
				?>
			</table>
			<h2>4. Pricing &amp; delivery</h2>
			<table class="form-table">
				<?php
				$f( 'bulk_on', 'Bulk pricing', '5% off 3+, 10% off 5+, 15% off 10+ of the same item (applied in the cart).', 'checkbox' );
				$f( 'bogo_on', 'Buy one, get one 50% off', 'Customers get whichever saves them more: BOGO or the bulk discount.', 'checkbox' );
				$f( 'promo_text', 'Promo bar text', 'The thin bar at the top of every page. Leave blank to hide it.' );
				$f( 'delivery_fee', 'Local delivery fee ($)', '', 'number' );
				$f( 'delivery_free', 'Free local delivery over ($)', '', 'number' );
				$f( 'ship_fee', 'Shipping fee ($)', '', 'number' );
				$f( 'ship_free', 'Free shipping over ($)', '', 'number' );
				$f( 'age_gate', '21+ entry screen', 'Ask visitors to confirm age and research use before entering the site.', 'checkbox' );
				?>
			</table>
			<?php submit_button( 'Save settings' ); ?>
		</form>
	</div>
	<?php
}
