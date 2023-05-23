// Landsat8 / 9

function maskClouds_L8(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
}

var L8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') // LANDSAT/LC09/C02/T1_L2
    .filter(criteria);

// Applies scaling factors.
function applyScaleFactors_L8(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

L8 = L8.map(applyScaleFactors_L8).map(maskClouds_L8).median().clip(geometry);

var visualization = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0,
  max: 0.3,
};

Map.addLayer(L8, visualization, 'Landsat True Color (432)');

// Export
Export.image.toDrive({
  image: L8.select(['SR_B2', 'SR_B3', 'SR_B4']),
  description: 'L8',
  scale: 30,
  region: geometry,
  maxPixels: 1e13
});