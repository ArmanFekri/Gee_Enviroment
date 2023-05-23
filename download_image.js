////////////////////////////////////////////////////////////
// Ref coddes///////////////////////////////////////////////
//*Link1: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_CLOUD_PROBABILITY
//*Link2: https://developers.google.com/earth-engine/tutorials/community/sentinel-2-s2cloudless
///////////////////////////////////////////////////////////

// Sentinel image
var s2Sr = ee.ImageCollection('COPERNICUS/S2_SR');
var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');

var START_DATE = ee.Date('1988-04-01');
var END_DATE = ee.Date('1990-10-01');
var MAX_CLOUD_PROBABILITY = 65;
var region = geometry

//Map.centerObject(geometry);

function maskClouds(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(MAX_CLOUD_PROBABILITY);
  return img.updateMask(isNotCloud).divide(10000);
}

// The masks for the 10m bands sometimes do not exclude bad data at
// scene edges, so we apply masks from the 20m and 60m bands as well.
// Example asset that needs this operation:
// COPERNICUS/S2_CLOUD_PROBABILITY/20190301T000239_20190301T000238_T55GDP
function maskEdges(s2_img) {
  return s2_img.updateMask(
      s2_img.select('B8A').mask().updateMask(s2_img.select('B9').mask()));
}

// Filter input collections by desired data range and region.
var criteria = ee.Filter.and(
    ee.Filter.bounds(region), ee.Filter.date(START_DATE, END_DATE));
s2Sr = s2Sr.filter(criteria).map(maskEdges);
s2Clouds = s2Clouds.filter(criteria);

// Join S2 SR with cloud probability dataset to add cloud mask.
var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply({
  primary: s2Sr,
  secondary: s2Clouds,
  condition:
      ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});

var s2CloudMasked =
    ee.ImageCollection(s2SrWithCloudMask).map(maskClouds).median().clip(geometry);
var rgbVis = {min: 0, max: 0.6, bands: ['B4', 'B3', 'B2']};

Map.addLayer(
    s2CloudMasked, rgbVis, 'S2 SR masked at ' + MAX_CLOUD_PROBABILITY + '%',
    true);

Export.image.toDrive({
  image: s2CloudMasked.select(['B2-4']),
  description: 'S2',
  scale: 10,
  region: geometry,
  maxPixels: 1e13
});

//////////////////////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////////////////////
// Landsat 7

function maskClouds_L7(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
}

var L7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2')
    .filter(criteria);

// Applies scaling factors.
function applyScaleFactors_L7(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
}

L7 = L7.map(applyScaleFactors_L7).map(maskClouds_L7).median().clip(geometry);

var visualization = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 0.0,
  max: 0.3,
};


Map.addLayer(L7, visualization, 'Landsat7 True Color (321)');

// Export
Export.image.toDrive({
  image: L7.select(['SR_B3', 'SR_B2', 'SR_B1']),
  description: 'L7',
  scale: 30,
  region: geometry,
  maxPixels: 1e13
});

//////////////////////////////////////////////////////////////////////////////
// Landsat 5

function maskClouds_L5(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
}

var L5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
    .filter(criteria);

// Applies scaling factors.
function applyScaleFactors_L5(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
}

L5 = L5.map(applyScaleFactors_L5).map(maskClouds_L5).median().clip(geometry);

var visualization = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 0.0,
  max: 0.3,
};


Map.addLayer(L5, visualization, 'Landsat5 True Color (321)');

// Export
Export.image.toDrive({
  image: L7.select(['SR_B3', 'SR_B2', 'SR_B1']),
  description: 'L5',
  scale: 30,
  region: geometry,
  maxPixels: 1e13
});

//////////////////////////////////////////////////////////////////////////////
// Landsat 4

function maskClouds_L4(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(mask.not());
}

var L4 = ee.ImageCollection('LANDSAT/LT04/C02/T1_L2')
    .filter(criteria);
print(L4)
// Applies scaling factors.
function applyScaleFactors_L4(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
}

L4 = L4.map(applyScaleFactors_L4).map(maskClouds_L4).median().clip(geometry);

var visualization = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 0.0,
  max: 0.3,
};

Map.addLayer(L4, visualization, 'Landsat4 True Color (321)');

// Export
Export.image.toDrive({
  image: L4.select(['SR_B3', 'SR_B2', 'SR_B1']),
  description: 'L4',
  scale: 30,
  region: geometry,
  maxPixels: 1e13
});