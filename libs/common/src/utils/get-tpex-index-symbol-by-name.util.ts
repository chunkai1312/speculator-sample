import { Index } from '../enums/index.enum';

export function getTpexIndexSymbolByName(name: string) {
  // 無對應指數: 塑膠工業, 橡膠工業, 油電燃氣業, 貿易百貨, 貿易百貨, 金融業, 電器電纜, 電子商務, 食品工業
  const indices = {
    '光電業': Index.TPExOptoelectronic,
    '其他': Index.TPExOther,
    '其他電子業': Index.TPExOtherElectronic,
    '化學工業': Index.TPExChemical,
    '半導體業': Index.TPExSemiconductors,
    '建材營造': Index.TPExBuildingMaterialsAndConstruction,
    '文化創意業': Index.TPExCulturalAndCreative,
    '生技醫療': Index.TPExBiotechnologyAndMedicalCare,
    '紡織纖維': Index.TPExTextiles,
    '航運業': Index.TPExShippingAndTransportation,
    '觀光事業': Index.TPExTourism,
    '資訊服務業': Index.TPExInformationService,
    '通信網路業': Index.TPExCommunicationsAndInternet,
    '鋼鐵工業': Index.TPExIronAndSteel,
    '電子通路業': Index.TPExElectronicProductsDistribution,
    '電子零組件業': Index.TPExElectronicPartsComponents,
    '電機機械': Index.TPExElectricMachinery,
    '電腦及週邊設備業': Index.TPExComputerAndPeripheralEquipment,
  };
  return indices[name];
}
