// App language. Every string shown through the themed <Text> is looked up here by its
// English wording; anything not listed stays in English. Order: en, yo, ig, ha, pcm.
// The translations are a first draft and should be reviewed by native speakers.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
  { code: 'pcm', label: 'Pidgin English' },
];

const ORDER = ['en', 'yo', 'ig', 'ha', 'pcm'];

const ROWS = [
  ['Home', 'Ilé', 'Ụlọ', 'Gida', 'Home'],
  ['Errands', 'Iṣẹ́ ìránṣẹ́', 'Ọrụ ozi', 'Ayyuka', 'Errand dem'],
  ['Wallet', 'Àpò owó', 'Akpa ego', 'Jakar kuɗi', 'Wallet'],
  ['Profile', 'Àkọọ́lẹ̀', 'Profaịlụ', 'Bayanan martaba', 'Profile'],
  ['Personal information', 'Àlàyé ara ẹni', 'Ozi onwe gị', 'Bayanan kai', 'Your personal info'],
  ['Personal info', 'Àlàyé ara ẹni', 'Ozi onwe gị', 'Bayanan kai', 'Your personal info'],
  ['Password', 'Ọ̀rọ̀ aṣínà', 'Okwuntughe', 'Kalmar sirri', 'Password'],
  [
    'Password Settings',
    'Ètò ọ̀rọ̀ aṣínà',
    'Ntọala okwuntughe',
    'Saitin kalmar sirri',
    'Password settings',
  ],
  ['PIN Settings', 'Ètò PIN', 'Ntọala PIN', 'Saitin PIN', 'PIN settings'],
  ['Theme', 'Àwọ̀ ìrísí', 'Ọdịdị', 'Jigo', 'Theme'],
  ['Themes', 'Àwọ̀ ìrísí', 'Ọdịdị', 'Jigo', 'Theme'],
  ['Light Mode', 'Ìrísí ìmọ́lẹ̀', 'Ọdịdị ìhè', 'Yanayin haske', 'Light mode'],
  ['Dark Mode', 'Ìrísí òkùnkùn', 'Ọdịdị ọchịchịrị', 'Yanayin duhu', 'Dark mode'],
  ['System default', 'Bí fóònù ṣe wà', 'Ihe ekwentị gị', 'Tsohuwar na’ura', 'Follow phone'],
  ['Push Notifications', 'Ìfitónilétí', 'Ọkwa', 'Sanarwa', 'Notifications'],
  ['Push Notification', 'Ìfitónilétí', 'Ọkwa', 'Sanarwa', 'Notifications'],
  [
    'Email Notifications',
    'Ìfitónilétí Íméèlì',
    'Ọkwa site na email',
    'Sanarwar imel',
    'Email notifications',
  ],
  [
    'Terms & Conditions',
    'Àwọn Òfin àti Àdéhùn',
    'Usoro na Ọnọdụ',
    'Sharuɗɗa da Ƙa’idoji',
    'Terms & Conditions',
  ],
  ['Privacy Policy', 'Ìlànà Àṣírí', 'Iwu Nzuzo', 'Manufar Sirri', 'Privacy Policy'],
  ['Support', 'Ìrànlọ́wọ́', 'Enyemaka', 'Taimako', 'Support'],
  ['Support Center', 'Ibùdó Ìrànlọ́wọ́', 'Ebe Enyemaka', 'Cibiyar Taimako', 'Support Center'],
  ['Report a problem', 'Jábọ̀ ìṣòro', 'Kọọ nsogbu', 'Bayar da rahoton matsala', 'Report wahala'],
  ['Log out', 'Jáde', 'Pụọ', 'Fita', 'Comot'],
  ['Logout', 'Jáde', 'Pụọ', 'Fita', 'Comot'],
  [
    'Delete Profile',
    'Pa Profaili rẹ́',
    'Hichapụ Profaịlụ',
    'Share Bayanan martaba',
    'Delete Profile',
  ],
  [
    'Switch to Pal profile',
    'Yípadà sí profaili Pal',
    'Gbanwee gaa na profaịlụ Pal',
    'Koma zuwa bayanin Pal',
    'Switch go Pal profile',
  ],
  [
    'Switch to User profile',
    'Yípadà sí profaili Olùlò',
    'Gbanwee gaa na profaịlụ Onye ọrụ',
    'Koma zuwa bayanin Mai amfani',
    'Switch go User profile',
  ],
  ['Become a Pal', 'Di Pal', 'Bụrụ Pal', 'Zama Pal', 'Become Pal'],
  ['Become a User', 'Di Olùlò', 'Bụrụ Onye ọrụ', 'Zama Mai amfani', 'Become User'],
  ['ID Verification', 'Ìjẹ́rìsí ID', 'Nkwenye ID', 'Tabbatar da ID', 'ID Verification'],
  ['Occupation / Skills', 'Iṣẹ́ / Ọgbọ́n', 'Ọrụ / Nka', 'Sana’a / Ƙwarewa', 'Work / Skills'],
  ['Availability', 'Wíwà', 'Ịdị', 'Samuwa', 'Availability'],
  ['Language', 'Èdè', 'Asụsụ', 'Harshe', 'Language'],
  ['Choose your language', 'Yan èdè rẹ', 'Họrọ asụsụ gị', 'Zaɓi harshenka', 'Choose your language'],
  ['Name', 'Orúkọ', 'Aha', 'Suna', 'Name'],
  ['Phone number', 'Nọ́mbà fóònù', 'Ọnụọgụ ekwentị', 'Lambar waya', 'Phone number'],
  ['Email', 'Íméèlì', 'Email', 'Imel', 'Email'],
  ['Edit', 'Ṣàtúnṣe', 'Dezie', 'Gyara', 'Edit'],
  ['Save', 'Fipamọ́', 'Chekwaa', 'Ajiye', 'Save'],
  ['Saving…', 'Ń fipamọ́…', 'Na-echekwa…', 'Ana ajiyewa…', 'Dey save…'],
  ['Continue', 'Tẹ̀síwájú', 'Gaa n’ihu', 'Ci gaba', 'Continue'],
  ['Next', 'Tókàn', 'Ọzọ', 'Na gaba', 'Next'],
  ['Request an errand', 'Béèrè fún iṣẹ́ ìránṣẹ́', 'Rịọ ọrụ ozi', 'Nemi aiki', 'Request an errand'],
  [
    'Active errand',
    'Iṣẹ́ tó ń lọ lọ́wọ́',
    'Ọrụ ozi na-aga n’ihu',
    'Aikin da ke gudana',
    'Errand wey dey go on',
  ],
  [
    'Recent errands',
    'Àwọn iṣẹ́ àìpẹ́',
    'Ọrụ ozi n’oge na-adịbeghị anya',
    'Ayyukan kwanan nan',
    'Recent errands',
  ],
  [
    'Available errands',
    'Àwọn iṣẹ́ tó wà',
    'Ọrụ ozi dị',
    'Ayyukan da ke akwai',
    'Errands wey dey available',
  ],
  ['All', 'Gbogbo', 'Niile', 'Duka', 'All'],
  ['Completed', 'Tí parí', 'Emechara', 'An kammala', 'Don finish'],
  ['Active', 'Ń lọ lọ́wọ́', 'Na-aga n’ihu', 'Mai aiki', 'Dey go on'],
  ['Pending', 'Ń dúró', 'Na-eche', 'Ana jira', 'Dey wait'],
  ['Canceled', 'Tí fagilé', 'Kagbuola', 'An soke', 'Cancel'],
  ['View details', 'Wo àlàyé', 'Lee nkọwa', 'Duba cikakkun bayani', 'See details'],
  [
    'We are here to help',
    'A wà níbí láti ràn ọ́ lọ́wọ́',
    'Anyị nọ ebe a inyere gị aka',
    'Muna nan don taimaka maka',
    'We dey here to help you',
  ],
  [
    'Message support',
    'Fi ìfiránṣẹ́ ránṣẹ́ sí ìrànlọ́wọ́',
    'Zipu ozi na enyemaka',
    'Aika sako ga taimako',
    'Message support',
  ],
  ['Contact us', 'Kàn sí wa', 'Kpọtụrụ anyị', 'Tuntuɓe mu', 'Contact us'],
  [
    'Change password',
    'Yí ọ̀rọ̀ aṣínà padà',
    'Gbanwee okwuntughe',
    'Canja kalmar sirri',
    'Change password',
  ],
  [
    'Current password',
    'Ọ̀rọ̀ aṣínà lọ́wọ́lọ́wọ́',
    'Okwuntughe ugbu a',
    'Kalmar sirri ta yanzu',
    'Current password',
  ],
  ['New password', 'Ọ̀rọ̀ aṣínà tuntun', 'Okwuntughe ọhụrụ', 'Sabuwar kalmar sirri', 'New password'],
  [
    'Confirm new password',
    'Jẹ́rìí ọ̀rọ̀ aṣínà tuntun',
    'Kwenye okwuntughe ọhụrụ',
    'Tabbatar da sabuwar kalmar sirri',
    'Confirm new password',
  ],
  ['Available', 'Mo wà', 'Adị m', 'Ina samuwa', 'I dey available'],
  ['Unavailable', 'Mi ò sí', 'Adịghị m', 'Ba na samuwa ba', 'I no dey available'],
  ['Login', 'Wọlé', 'Banye', 'Shiga', 'Login'],
  ['Sign Up', 'Forúkọ sílẹ̀', 'Debanye aha', 'Yi rajista', 'Sign Up'],
];

const DICT = {};
ROWS.forEach((row) => {
  DICT[row[0]] = {};
  ORDER.slice(1).forEach((code, index) => {
    DICT[row[0]][code] = row[index + 1];
  });
});

let current = 'en';
export const setLanguage = (code) => {
  current = DICT && ORDER.includes(code) ? code : 'en';
};
export const getLanguage = () => current;

/** Returns the translation of an English string, or the string itself. */
export function translate(text) {
  if (current === 'en' || typeof text !== 'string') return text;
  return DICT[text]?.[current] || text;
}

export function translateChildren(children) {
  if (typeof children === 'string') return translate(children);
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === 'string' ? translate(child) : child));
  }
  return children;
}
