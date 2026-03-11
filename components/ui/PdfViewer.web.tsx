import React from 'react';
import { View } from 'react-native';

export default function PdfViewer({ source }: any) {
  return (
    <View style={{ flex: 1 }}>
      <iframe
        src={source.uri}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Document Preview"
      />
    </View>
  );
}