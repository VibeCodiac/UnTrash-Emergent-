// Simple image upload utility (no Cloudinary required)

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const uploadImageSimple = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const base64Image = e.target.result;
        
        // Upload to backend
        const response = await fetch(`${API}/images/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            image: base64Image
          })
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        // Return full URL
        const imageUrl = `${BACKEND_URL}${data.url}`;
        resolve(imageUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const getImageDataUrl = async (imageUrl) => {
  // If it's already a data URL, return it
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it's our backend URL, fetch the data URL
  if (imageUrl.includes('/api/images/')) {
    try {
      const response = await fetch(imageUrl, {
        credentials: 'include'
      });
      const data = await response.json();
      return data.data_url;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  }
  
  // Otherwise return as is
  return imageUrl;
};
