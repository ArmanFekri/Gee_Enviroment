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