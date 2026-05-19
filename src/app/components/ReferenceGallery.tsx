import { useState } from 'react';
import { Box, Dialog, IconButton, Paper, Typography, ImageList, ImageListItem } from '@mui/material';
import { Close, Collections } from '@mui/icons-material';
import imgScreenshot1 from '../../imports/Group3/0d27650120d81e703593f1744e86bac90eb2077a.png';
import imgScreenshot2 from '../../imports/Group3/87e1686193bce54aedb5d51b9fdb8cbf9cadca3e.png';
import imgScreenshot3 from '../../imports/Group3/1c68e709e9ba98df1c77aa3ec42d45d89d819c03.png';
import imgScreenshot4 from '../../imports/Group3/0488f3bf3bbd6ce9422a7f7c95722d4d9beb9ae2.png';

const referenceImages = [
  { src: imgScreenshot1, title: 'Desktop Seat Map View' },
  { src: imgScreenshot2, title: 'Grid Seat Selector' },
  { src: imgScreenshot3, title: 'Ticketmaster Mobile' },
  { src: imgScreenshot4, title: 'Mobile Seat View' },
];

export function ReferenceGallery() {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
      >
        <Collections />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reference Designs
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <ImageList cols={2} gap={16} sx={{ maxHeight: '70vh' }}>
            {referenceImages.map((item) => (
              <ImageListItem
                key={item.src}
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedImage(item.src)}
              >
                <Paper
                  elevation={2}
                  sx={{
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                  <Box sx={{ p: 1, backgroundColor: 'background.paper' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                  </Box>
                </Paper>
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      </Dialog>

      {/* Full Size Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="xl"
        fullWidth
      >
        <IconButton
          onClick={() => setSelectedImage(null)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          }}
        >
          <Close />
        </IconButton>
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Full size"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        )}
      </Dialog>
    </>
  );
}
