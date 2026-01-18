Map.addLayer(jelok_adm)
Map.centerObject(jelok_adm, 9)

//Memanggil Citra Landsat 8
var Landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2");

// Memfilter Citra Landsat 8 Berdasarkan Wilayah
var L8Boyolali = Landsat8.filterBounds(jelok_adm);

// Memfilter Citra Landsat 8 Berdasarkan Waktu
var L8BoyolaliDate = L8Boyolali.filterDate('2023-05-01','2023-09-30');

// Cloud Masking Citra Landsat 8
var masking = function (img) {
  var cloudshadowbitmask = (1 << 3)
  var cloudshadowmask = (1 << 4)
  var qa = img.select('QA_PIXEL')
  var maskshadow = qa.bitwiseAnd(cloudshadowbitmask).eq(0)
  var maskcloud = qa.bitwiseAnd(cloudshadowmask).eq(0)
  var mask = maskshadow.and(maskcloud)
  return img.updateMask(mask)
};
var L8Clear = L8BoyolaliDate.sort('CLOUD_COVER_LAND')
            .map(masking)
            .median();
            
// Clip Citra Landsat 8
var L8Clip = L8Clear.clip(jelok_adm);

//Scaling Factors
var scale = function applyScaleFactors(image) {
var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
return image.addBands(opticalBands, null, true)
		.addBands(thermalBands, null, true);
}
var L8scale = scale(L8Clip);

// Display
Map.addLayer(L8scale);

// Display Citra True Color
Map.addLayer(L8scale, imageVisParam, 'Landsat 8 True Color');

// Memposisikan wilayah penelitian tepat di tengah
Map.centerObject(jelok_adm,10);

//Land Surface Temperature (LST)
//Define Thermal Band
var thermal = L8scale.select('ST_B10');

//Mendapatkan Suhu dalam Celcius
var LSTcelcius = thermal.subtract(273);
var LSTParams = {min:0, max:50,palette:['blue','limegreen','yellow','orange', 'red']};

Map.addLayer(LSTcelcius, LSTParams, 'Landsat 8 LST');


//Menambahkan Legenda
var panel = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '5px;'
  }
})

//Mengatur Label
var title = ui.Label({
  value: 'LST',
  style: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0px;'
  }
})

panel.add(title)

//Mengatur Legenda
var color = ['blue','green','yellow','orange','red']
var lc_class = ['dingin', 'sejuk', 'normal','hangat','panas']

var list_legend = function(color, description) {
  
  var c = ui.Label({
    style: {
      backgroundColor: color,
      padding: '10px',
      margin: '5px'
    }
  })
  
  var ds = ui.Label({
    value: description,
    style: {
      margin: '5px'
    }
  })
  
  return ui.Panel({
    widgets: [c, ds],
    layout: ui.Panel.Layout.Flow('horizontal')
  })
}

for(var a = 0; a < 5; a++){
  panel.add(list_legend(color[a], lc_class[a]))
}

Map.add(panel)


//Export Map
Export.image.toDrive({
  image: LSTcelcius,
  description: 'LST_Jelok',
  folder: 'hasil_lst',
  region: jelok_adm,
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});
