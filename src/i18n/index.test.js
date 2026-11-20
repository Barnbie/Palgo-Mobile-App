import { setLanguage, translate } from './index';

describe('translate', () => {
  afterEach(() => setLanguage('en'));
  it('keeps English as is', () => {
    expect(translate('Support')).toBe('Support');
  });
  it('translates known strings and falls back for unknown ones', () => {
    setLanguage('yo');
    expect(translate('Support')).toBe('Ìrànlọ́wọ́');
    expect(translate('Something new')).toBe('Something new');
  });
});
