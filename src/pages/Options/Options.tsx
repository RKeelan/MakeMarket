import React, { useEffect, useState } from 'react';
import './Options.css';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Load the API key from storage when the component mounts
    chrome.storage.sync.get(['manifoldApiKey'], (result) => {
      if (result.manifoldApiKey) {
        setApiKey(result.manifoldApiKey);
      }
    });
  }, []);

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = event.target.value;
    setApiKey(newApiKey);
    
    // Save the API key to storage
    chrome.storage.sync.set({ manifoldApiKey: newApiKey });
  };

  return (
    <div className="OptionsContainer">
      <h1>{title}</h1>
      <div className="OptionItem">
        <label htmlFor="manifoldApiKey">Manifold Markets API Key:</label>
        <input
          type="text"
          id="manifoldApiKey"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your Manifold Markets API Key"
        />
      </div>
    </div>
  );
};

export default Options;
