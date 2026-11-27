<?php
get_header();
$wide = function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() );
?>
<main id="main" class="block">
	<div class="wrap <?php echo $wide ? '' : 'narrow'; ?>">
		<?php while ( have_posts() ) : the_post(); ?>
			<article <?php post_class( 'entry' ); ?>>
				<h1><?php the_title(); ?></h1>
				<div class="prose"><?php the_content(); ?></div>
			</article>
		<?php endwhile; ?>
	</div>
</main>
<?php get_footer();
