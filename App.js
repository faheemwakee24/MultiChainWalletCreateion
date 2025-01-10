// App.js
import React, { useState } from 'react';

import AppStack from './AppStack';


const App = () => {
  const [showSecondComponent, setShowSecondComponent] = useState(false);

  return (
    <AppStack/>
  );
};

export default App;
