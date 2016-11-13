<?php
/**
 * Plugin Name: Custom Header Handler for Vimeo
 * Description: Adds support for Vimeo to the video headers feature introduced in WordPress 4.7.
 * Version: 1.0.0
 * Author: Brady Vercher
 * Author URI: https://www.cedaro.com/
 * License: GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function chvimeo_maybe_enqueue_vimeo_handler() {
	if ( wp_script_is( 'wp-custom-header' ) ) {
		wp_enqueue_script(
			'wp-custom-header-vimeo',
			plugin_dir_url( __FILE__ ) . 'custom-header-vimeo.js',
			array( 'wp-custom-header' )
		);
	}
}
add_action( 'wp_footer', 'chvimeo_maybe_enqueue_vimeo_handler' );

function chvimeo_header_video_settings( $settings ) {
	if ( preg_match( '#^https?://(.+\.)?vimeo\.com/.*#', $settings['videoUrl'] ) ) {
		$settings['mimeType'] = 'video/x-vimeo';
	}

	return $settings;
}
add_filter( 'header_video_settings', 'chvimeo_header_video_settings' );

function chvimeo_filter_external_header_video_setting_validity( $validity, $value ) {
	if ( preg_match( '#^https?://(.+\.)?vimeo\.com/.*#', $value ) ) {
		return true;
	}

	return $validity;
}
add_filter( 'customize_validate_external_header_video', 'chvimeo_filter_external_header_video_setting_validity', 11, 2 );
