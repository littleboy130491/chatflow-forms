import { describe, expect, it } from 'vitest';
import { isWhatsapp, parseWhatsapp, whatsappNumber, whatsappUrl } from '../../../assets/src/shared/whatsapp';
import { interpolateLink } from '../../../assets/src/runtime/content';

describe('WhatsApp links', () => {
  it('builds wa.me links that keep merge tags for click-time answers', () => {
    expect(whatsappNumber('+62 812-3456-7890')).toBe('6281234567890');
    const url = whatsappUrl('+62 812 3456 7890', 'Halo, saya {{name}} & butuh {{layanan}}?');
    expect(url).toBe('https://wa.me/6281234567890?text=Halo%2C%20saya%20{{name}}%20%26%20butuh%20{{layanan}}%3F');
    expect(interpolateLink(url, { name: 'Ada & Co', layanan: 'Website' })).toBe('https://wa.me/6281234567890?text=Halo%2C%20saya%20Ada%20%26%20Co%20%26%20butuh%20Website%3F');
    expect(whatsappUrl('6281', '')).toBe('https://wa.me/6281');
  });
  it('recognises and parses WhatsApp links back into number and message', () => {
    expect(isWhatsapp('https://wa.me/62812')).toBe(true);
    expect(isWhatsapp('https://api.whatsapp.com/send?phone=62812')).toBe(true);
    expect(isWhatsapp('https://example.test/wa.me')).toBe(false);
    expect(parseWhatsapp(whatsappUrl('62812345', 'Hi {{name}}, 100% ready'))).toEqual({ phone: '62812345', message: 'Hi {{name}}, 100% ready' });
    expect(parseWhatsapp('https://api.whatsapp.com/send?phone=62812&text=Hello')).toEqual({ phone: '62812', message: 'Hello' });
    expect(parseWhatsapp('https://example.test/')).toBeNull();
  });
});
