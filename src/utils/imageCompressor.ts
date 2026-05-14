export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let targetWidth = img.width;
                let targetHeight = img.height;
                const maxDim = 800; // max width or height
                if (targetWidth > maxDim || targetHeight > maxDim) {
                   if (targetWidth > targetHeight) {
                       targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
                       targetWidth = maxDim;
                   } else {
                       targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
                       targetHeight = maxDim;
                   }
                }
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/webp', 0.8));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};
