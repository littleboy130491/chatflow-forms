<?php
namespace ChatFlow\Templates;

final class Imajiner {
	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function definition(): array {
		$steps   = array();
		$add     = function ( string $key, string $type, string $label, array $messages, bool $required = false, array $extra = array() ) use ( &$steps ): void {
			$steps[] = array_merge(
				array(
					'id'       => 'step_' . $key,
					'key'      => $key,
					'type'     => $type,
					'label'    => $label,
					'messages' => $messages,
					'required' => $required,
				),
				$extra
			);
		};
		$options = function ( string $key, array $labels, ?int $other = null ): array {
			$result = array();
			foreach ( $labels as $index => $label ) {
				$option = array(
					'id'    => 'option_' . $key . '_' . $index,
					'value' => $label,
					'label' => $label,
				);
				if ( $index === $other ) {
					$option['isOther'] = true;
				} $result[] = $option;
			} return $result;
		};
		$add( 'intro', 'statement', 'Pembuka', array( 'Halo! 👋 Saya Ima dari Imajiner.', 'Saya akan bantu memahami kebutuhan website Anda, cuma ±2 menit.', 'Tenang, Anda **tidak akan dikejar-kejar sales** 😉' ), false );
		$add(
			'punya_website',
			'single_choice',
			'Pernah punya website',
			array( 'Sebelumnya, apakah Anda sudah pernah punya website?' ),
			true,
			array(
				'options'  => $options( 'punya', array( 'Belum pernah', 'Pernah, beli dari penyedia jasa', 'Pernah, buat sendiri', 'Pernah, dibuatkan teman / rekan' ) ),
				'settings' => array( 'layout' => 'chips' ),
				'logic'    => array(
					array(
						'if'   => array(
							'field' => 'punya_website',
							'op'    => 'eq',
							'value' => 'Belum pernah',
						),
						'then' => array(
							'action' => 'jump',
							'to'     => 'step_layanan',
						),
					),
				),
			)
		);
		$add(
			'alamat_website',
			'short_text',
			'Alamat website',
			array( 'Boleh tahu alamat website-nya?' ),
			false,
			array(
				'placeholder' => 'contoh.com',
				'validation'  => array(
					'format'    => 'url',
					'maxLength' => 2000,
				),
				'settings'    => array( 'inputMode' => 'url' ),
			)
		);
		$add(
			'layanan',
			'single_choice',
			'Layanan',
			array( 'Layanan apa yang Anda butuhkan?' ),
			true,
			array(
				'options'  => $options( 'layanan', array( 'Membuat website baru', 'Re-design website yang sudah ada', 'Maintenance website', 'Lainnya' ), 3 ),
				'settings' => array( 'layout' => 'chips' ),
			)
		);
		$add(
			'jenis_website',
			'single_choice',
			'Jenis website',
			array( 'Website seperti apa yang Anda inginkan?' ),
			true,
			array(
				'options'  => $options( 'jenis', array( '🛒 Online Shop / eCommerce', '🏢 Company / Business Profile', '📰 Blog / Portal Berita', '🎯 One Page (Landing / Sales Page)', 'Lainnya' ), 4 ),
				'settings' => array( 'layout' => 'cards' ),
			)
		);
		$add(
			'deskripsi',
			'long_text',
			'Deskripsi website',
			array( 'Ceritakan singkat tentang website impian Anda ✨' ),
			false,
			array(
				'placeholder' => 'misalnya: saya ingin membuat online shop dengan tema fashion, dilengkapi fitur Blog, seperti fashionshop.com',
				'validation'  => array( 'maxLength' => 10000 ),
			)
		);
		$add(
			'budget',
			'single_choice',
			'Budget',
			array( 'Berapa estimasi budget yang Anda siapkan?' ),
			true,
			array(
				'helpText' => 'Info ini membantu kami memberi rekomendasi yang paling pas 🙏',
				'options'  => $options( 'budget', array( '< Rp5 jt', 'Rp5–10 jt', 'Rp10–25 jt', 'Rp25–50 jt', '> Rp50 jt', 'Belum tahu' ) ),
				'settings' => array( 'layout' => 'chips' ),
			)
		);
		$add( 'privasi', 'statement', 'Privasi', array( 'Sedikit lagi! Imajiner menjamin kerahasiaan data Anda dan tidak akan menyebarkannya tanpa izin 🔒' ), false, array( 'settings' => array( 'autoContinue' => true ) ) );
		$add(
			'nama',
			'short_text',
			'Nama',
			array( 'Dengan siapa saya berbicara?' ),
			true,
			array(
				'settings'   => array( 'autocomplete' => 'name' ),
				'validation' => array( 'maxLength' => 200 ),
			)
		);
		$add(
			'whatsapp',
			'phone',
			'WhatsApp',
			array( 'Senang kenalan, {{nama}}! Nomor HP / WhatsApp yang bisa dihubungi?' ),
			true,
			array(
				'settings'    => array(
					'country'      => 'ID',
					'inputMode'    => 'tel',
					'autocomplete' => 'tel',
				),
				'placeholder' => '+62',
			)
		);
		$add(
			'email',
			'email',
			'Email',
			array( 'Alamat email Anda? (opsional)' ),
			false,
			array(
				'settings' => array(
					'autocomplete' => 'email',
					'inputMode'    => 'email',
				),
			)
		);
		$add( 'boleh_ditelepon', 'yes_no', 'Boleh ditelepon', array( 'Bolehkah tim kami menelepon untuk diskusi lebih lanjut?' ), true );
		$add( 'catatan', 'long_text', 'Catatan', array( 'Ada hal lain yang ingin Anda sampaikan?' ), false, array( 'validation' => array( 'maxLength' => 10000 ) ) );
		$add( 'summary', 'summary', 'Ringkasan', array( 'Ini ringkasan jawaban Anda, sudah benar?' ), false, array( 'settings' => array( 'buttonLabel' => 'Request Free Demo' ) ) );
		foreach ( array( 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid', 'sumber_halaman' ) as $key ) {
			$add(
				$key,
				'hidden',
				$key,
				array(),
				false,
				array(
					'settings' => array(
						'source'    => 'meta',
						'sourceKey' => 'sumber_halaman' === $key ? 'page_title' : $key,
					),
				)
			); }
		$wa = 'https://wa.me/6285219798588?text=Halo%20Imajiner%2C%20saya%20{{nama}}%20ingin%20Request%20Free%20Demo%20untuk%20{{jenis_website}}.%20Layanan%3A%20{{layanan}}.%20Budget%3A%20{{budget}}.';
		return array(
			'title'    => 'Survei Website Imajiner',
			'schema'   => array(
				'schemaVersion' => 1,
				'bot'           => array(
					'name'        => 'Ima',
					'typingSpeed' => 'normal',
				),
				'steps'         => $steps,
				'groups'        => array(),
				'variables'     => array(),
				'endings'       => array(
					array(
						'id'       => 'end_default',
						'type'     => 'message',
						'messages' => array( 'Terima kasih, {{nama}}! 🎉 Tim Imajiner akan menghubungi Anda di {{whatsapp}} pada jam kerja (09.00–18.00 WIB, Senin–Jumat).' ),
						'buttons'  => array(
							array(
								'id'     => 'button_whatsapp',
								'label'  => 'Chat via WhatsApp',
								'action' => 'link',
								'url'    => $wa,
							),
							array(
								'id'     => 'button_home',
								'label'  => 'Kembali ke beranda',
								'action' => 'link',
								'url'    => '/',
							),
						),
					),
				),
			),
			'settings' => array(
				'appearance'    => array(
					'primary'     => '#262626',
					'radius'      => 8,
					'theme'       => 'light',
					'inheritFont' => true,
				),
				'phrases'       => array(
					'next'     => 'Lanjut',
					'back'     => 'Sebelumnya',
					'skip'     => 'Lewati',
					'submit'   => 'Request Free Demo',
					'yes'      => 'Ya 👍',
					'no'       => 'Tidak, chat saja',
					'required' => 'Mohon isi jawaban ini.',
					'resume'   => 'Lanjutkan percakapan sebelumnya?',
					'restart'  => 'Mulai lagi',
				),
				'completion'    => array(
					'defaultEndingId'      => 'end_default',
					'allowedRedirectHosts' => array( 'wa.me' ),
				),
				'sessions'      => array(
					'savePartial'            => true,
					'resumeEnabled'          => true,
					'resumePrompt'           => true,
					'resumeDays'             => 30,
					'abandonDays'            => 30,
					'deletePartialOnRestart' => false,
				),
				'privacy'       => array(
					'storeMeta'      => true,
					'ipMode'         => 'anonymized',
					'storeUserAgent' => false,
					'respectDnt'     => true,
				),
				'spam'          => array(
					'honeypotEnabled'   => true,
					'minSeconds'        => 2,
					'rateLimit'         => 10,
					'rateWindowSeconds' => 600,
					'captcha'           => 'none',
					'akismetEnabled'    => false,
				),
				'notifications' => array(
					'admin'           => array(),
					'autoresponders'  => array(
						array(
							'id'         => 'imajiner_thanks',
							'enabled'    => true,
							'emailField' => 'email',
							'conditions' => array(
								'field' => 'email',
								'op'    => 'is_not_empty',
							),
							'subject'    => 'Terima kasih, {{nama}}! Permintaan demo Anda sudah kami terima',
							'body'       => "Halo {{nama}},\n\nPermintaan demo Anda sudah kami terima.\n\n{{all_answers}}\n\nTim Imajiner akan menghubungi Anda pada jam kerja: 09.00–18.00 WIB, Senin–Jumat.\n\n[cff_button url=\"" . $wa . '"]Chat via WhatsApp[/cff_button]',
						),
					),
					'firstMatchOnly'  => false,
					'notifyAbandoned' => false,
				),
				'display'       => array(
					'mode'   => 'inline',
					'theme'  => 'light',
					'height' => 600,
				),
			),
		);
	}
}
