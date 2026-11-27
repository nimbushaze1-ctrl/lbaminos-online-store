<?php get_header(); ?>
<main id="main" class="block">
	<div class="wrap narrow">
		<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
			<article <?php post_class( 'entry' ); ?>>
				<h1><?php the_title(); ?></h1>
				<div class="prose"><?php the_content(); ?></div>
			</article>
		<?php endwhile; else : ?>
			<h1>Nothing here yet</h1>
			<p><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Go home</a></p>
		<?php endif; ?>
	</div>
</main>
<?php get_footer();
