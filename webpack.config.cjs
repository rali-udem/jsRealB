const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/jsRealB.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'jsRealB.js',
    library :{
      name:"jsRealB",
      type:"umd"
    },
    globalObject:"globalThis",
  },
  plugins:[
    new webpack.DefinePlugin({
        BUILDTIME: JSON.stringify(new Date().toLocaleString("en-CA"))
    })
  ]  
};
module.exports = config;