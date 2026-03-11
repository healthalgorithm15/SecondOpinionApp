import React from 'react';
import Pdf from 'react-native-pdf';
import { Dimensions, StyleSheet } from 'react-native';

export default function PdfViewer({ source, style }: any) {
  return (
    <Pdf
      trustAllCerts={false}
      source={source}
      style={[styles.pdf, style]}
      onLoadComplete={(num) => console.log(`✅ Loaded ${num} pages`)}
      onError={(error) => console.log('❌ PDF Error:', error)}
    />
  );
}

const styles = StyleSheet.create({
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});