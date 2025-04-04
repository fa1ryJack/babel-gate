export const deeplTesseractMappings = {
  sourceLanguages: [
    { tesseract_code: "ara", deepl_source: "AR", language: "Arabic" },
    { tesseract_code: "bul", deepl_source: "BG", language: "Bulgarian" },
    {
      tesseract_code: "chi_sim",
      deepl_source: "ZH",
      language: "Chinese (all Chinese variants)",
    },
    {
      tesseract_code: "chi_tra",
      deepl_source: "ZH",
      language: "Chinese (all Chinese variants)",
    },
    { tesseract_code: "ces", deepl_source: "CS", language: "Czech" },
    { tesseract_code: "dan", deepl_source: "DA", language: "Danish" },
    { tesseract_code: "nld", deepl_source: "NL", language: "Dutch" },
    {
      tesseract_code: "eng",
      deepl_source: "EN",
      language: "English (all English variants)",
    },
    { tesseract_code: "est", deepl_source: "ET", language: "Estonian" },
    { tesseract_code: "fin", deepl_source: "FI", language: "Finnish" },
    { tesseract_code: "fra", deepl_source: "FR", language: "French" },
    { tesseract_code: "deu", deepl_source: "DE", language: "German" },
    { tesseract_code: "ell", deepl_source: "EL", language: "Greek" },
    { tesseract_code: "hun", deepl_source: "HU", language: "Hungarian" },
    { tesseract_code: "ind", deepl_source: "ID", language: "Indonesian" },
    { tesseract_code: "ita", deepl_source: "IT", language: "Italian" },
    { tesseract_code: "jpn", deepl_source: "JA", language: "Japanese" },
    { tesseract_code: "kor", deepl_source: "KO", language: "Korean" },
    { tesseract_code: "lav", deepl_source: "LV", language: "Latvian" },
    { tesseract_code: "lit", deepl_source: "LT", language: "Lithuanian" },
    { tesseract_code: "nor", deepl_source: "NB", language: "Norwegian Bokmål" },
    { tesseract_code: "pol", deepl_source: "PL", language: "Polish" },
    {
      tesseract_code: "por",
      deepl_source: "PT",
      language: "Portuguese (all Portuguese variants)",
    },
    { tesseract_code: "ron", deepl_source: "RO", language: "Romanian" },
    { tesseract_code: "rus", deepl_source: "RU", language: "Russian" },
    { tesseract_code: "slk", deepl_source: "SK", language: "Slovak" },
    { tesseract_code: "slv", deepl_source: "SL", language: "Slovenian" },
    { tesseract_code: "spa", deepl_source: "ES", language: "Spanish" },
    { tesseract_code: "swe", deepl_source: "SV", language: "Swedish" },
    { tesseract_code: "tur", deepl_source: "TR", language: "Turkish" },
    { tesseract_code: "ukr", deepl_source: "UK", language: "Ukrainian" },
  ].sort((a, b) => a.language.localeCompare(b.language)),

  targetLanguages: [
    { deepl_target: "AR", language: "Arabic" },
    { deepl_target: "BG", language: "Bulgarian" },
    { deepl_target: "ZH-HANS", language: "Chinese (simplified)" },
    { deepl_target: "ZH-HANT", language: "Chinese (traditional)" },
    { deepl_target: "ZH", language: "Chinese (unspecified variant)" },
    { deepl_target: "CS", language: "Czech" },
    { deepl_target: "DA", language: "Danish" },
    { deepl_target: "NL", language: "Dutch" },
    { deepl_target: "EN-US", language: "English (American)" },
    { deepl_target: "EN-GB", language: "English (British)" },
    { deepl_target: "ET", language: "Estonian" },
    { deepl_target: "FI", language: "Finnish" },
    { deepl_target: "FR", language: "French" },
    { deepl_target: "DE", language: "German" },
    { deepl_target: "EL", language: "Greek" },
    { deepl_target: "HU", language: "Hungarian" },
    { deepl_target: "ID", language: "Indonesian" },
    { deepl_target: "IT", language: "Italian" },
    { deepl_target: "JA", language: "Japanese" },
    { deepl_target: "KO", language: "Korean" },
    { deepl_target: "LV", language: "Latvian" },
    { deepl_target: "LT", language: "Lithuanian" },
    { deepl_target: "NB", language: "Norwegian Bokmål" },
    { deepl_target: "PL", language: "Polish" },
    { deepl_target: "PT-BR", language: "Portuguese (Brazilian)" },
    { deepl_target: "PT-PT", language: "Portuguese (excluding Brazilian)" },
    { deepl_target: "PT", language: "Portuguese (unspecified variant)" },
    { deepl_target: "RO", language: "Romanian" },
    { deepl_target: "RU", language: "Russian" },
    { deepl_target: "SK", language: "Slovak" },
    { deepl_target: "SL", language: "Slovenian" },
    { deepl_target: "ES", language: "Spanish" },
    { deepl_target: "SV", language: "Swedish" },
    { deepl_target: "TR", language: "Turkish" },
    { deepl_target: "UK", language: "Ukrainian" },
  ].sort((a, b) => a.language.localeCompare(b.language)),
};
