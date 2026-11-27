<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/img/favicon.svg' ); ?>" type="image/svg+xml">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">Skip to content</a>
<div class="ruo-bar">FOR LABORATORY RESEARCH USE ONLY · NOT FOR HUMAN OR ANIMAL USE · 21+</div>
<?php if ( lbt_opt( 'promo_text' ) ) : ?>
	<div class="promo-bar"><div class="wrap"><?php echo esc_html( lbt_opt( 'promo_text' ) ); ?></div></div>
<?php endif; ?>
<header class="site">
	<div class="wrap">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="LB Aminos home"><?php echo lbt_logo(); // phpcs:ignore ?></a>
		<nav class="main" id="site-nav" aria-label="Main">
			<?php
			if ( has_nav_menu( 'primary' ) ) {
				wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'menu_class' => 'menu', 'depth' => 1 ) );
			} else {
				echo '<ul class="menu">';
				foreach ( array( 'shop' => 'Shop', 'coa' => 'Lab reports', 'local-pickup' => 'Local pickup', 'peptide-basics' => 'Learn', 'about' => 'About', 'contact' => 'Contact' ) as $slug => $label ) {
					echo '<li><a href="' . esc_url( lbt_url( $slug ) ) . '">' . esc_html( $label ) . '</a></li>';
				}
				echo '</ul>';
			}
			?>
		</nav>
		<div class="head-actions">
			<?php if ( lbt_woo() ) : $n = WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?>
				<a class="cart-link" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="Cart">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
					<span class="cart-count<?php echo $n ? ' on' : ''; ?>"><?php echo (int) $n; ?></span>
				</a>
				<a class="btn btn-primary btn-sm hide-sm" href="<?php echo esc_url( lbt_url( 'shop' ) ); ?>">Shop now</a>
			<?php else : ?>
				<a class="btn btn-primary btn-sm hide-sm" href="tel:<?php echo esc_attr( lbt_tel( lbt_opt( 'phone' ) ) ); ?>">Text to order</a>
			<?php endif; ?>
			<button class="menu-btn" aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><span></span><span></span></button>
		</div>
	</div>
</header>
