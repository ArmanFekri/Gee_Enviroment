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

