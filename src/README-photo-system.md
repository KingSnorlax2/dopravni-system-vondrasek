# Car Photo Management System

This document explains how the car photo management system works, including uploading, storing, displaying, editing, resizing, positioning, and setting thumbnails for photos.

## Overview

The system provides a complete photo management solution for vehicles, allowing users to:
- Upload photos of cars
- View photos in a gallery with adjustable sizing
- Edit/replace existing photos
- Position and scale photos for optimal framing
- Set a photo as the car's thumbnail image
- Delete photos when needed

## Data Storage

Photos are stored in the `Fotka` table with the following structure:

```prisma
model Fotka {
  id        String   @id @default(cuid())
  data      String   @db.Text  // Base64 encoded image data
  mimeType  String   // Content type (e.g., image/jpeg)
  autoId    Int?
  positionX Float?   // Horizontal position (percentage from 0 to 100)
  positionY Float?   // Vertical position (percentage from 0 to 100)
  scale     Float?   // Zoom scale factor
  auto      Auto?    @relation("AutoFotky", fields: [autoId], references: [id], onDelete: Cascade)
}
```

The `Auto` model has a reference to the thumbnail photo:

```prisma
model Auto {
  // Other fields...
  thumbnailFotoId String?  // References the ID of the photo to use as thumbnail
  // Other fields...
}
```

## Key Features

1. **Base64 Storage**:
   - Images are stored directly in the database as base64 encoded strings
   - This eliminates the need for external file storage
   - The mime type is stored to ensure proper rendering

2. **Lazy Loading**:
   - Photos are only loaded when the Photos tab is active
   - This improves page load performance

3. **Interactive UI**:
   - Hover effects show edit, positioning, thumbnail selection, and delete buttons
   - Loading animations during upload and edit operations
   - Empty state UI when no photos exist

4. **Photo Size Controls**:
   - Users can adjust the size of photos in the gallery (small, medium, large)
   - Size preference is maintained during the session

5. **Photo Positioning**:
   - Interactive interface for adjusting the framing of photos
   - Drag to change position and use slider to adjust zoom
   - Positioning settings are saved with the photo

6. **Thumbnail Selection**:
   - Any photo can be set as the thumbnail for the car
   - The selected thumbnail is visually indicated with a border and badge
   - The thumbnail is used to represent the car in the car listing table

## API Endpoints

### Photo Endpoints

- `GET /api/auta/[id]/fotky` - Get all photos for a car
- `POST /api/auta/[id]/fotky` - Upload a new photo for a car
- `PUT /api/auta/[id]/fotky/[fotoId]` - Update/replace an existing photo
- `DELETE /api/auta/[id]/fotky/[fotoId]` - Delete a specific photo
- `POST /api/auta/[id]/fotky/[fotoId]/thumbnail` - Set a photo as the car's thumbnail
- `PUT /api/auta/[id]/fotky/[fotoId]/position` - Update a photo's position and scale

## Implementation Details

### Photo Upload Process

1. User selects a file through the file input
2. The file is validated for valid image types (JPEG, PNG, GIF, WebP)
3. The file is read as an ArrayBuffer
4. The buffer is converted to a base64 string
5. The base64 data and mime type are stored in the database
6. The UI is updated to show the new photo without page reload

### Photo Editing Process

1. User clicks the edit button (pencil icon) on a photo
2. A file picker is opened for selecting the replacement image
3. The new image file is validated for valid image types
4. The file is read as an ArrayBuffer and converted to base64
5. The existing photo record is updated with the new image data and mime type
6. The UI is updated to show the edited photo without page reload

### Photo Positioning Process

1. User clicks the positioning button (crop icon) on a photo
2. A positioning modal opens with the selected photo
3. User can:
   - Drag the photo to adjust horizontal and vertical position
   - Use a slider to zoom in or out
   - Click "Reset" to return to default positioning
4. The positioning data (X position, Y position, scale) is saved to the database
5. The photo is displayed using the saved positioning settings

### Photo Resize Feature

1. User clicks on one of the size buttons (S, M, L) in the gallery controls
2. The system adjusts the display size of all photos in the gallery
3. The size preference is stored in component state and persists during the session
4. The layout adapts to maintain the grid structure with the new photo size

### Thumbnail Selection Process

1. User clicks the thumbnail button (image icon) on a photo
2. A request is sent to the server to set this photo as the car's thumbnail
3. The `thumbnailFotoId` field in the `Auto` model is updated
4. The UI updates to show the selected photo with a thumbnail indicator
5. This photo will be used to represent the car in the car listing table

### Photo Rendering Process

1. Photos are fetched from the database when the car detail page loads
2. Each photo's base64 data is combined with its mime type to create a data URL
3. If positioning data exists, it's applied to the image via CSS styling
4. The photo is displayed with the appropriate size, position, and scale

### Photo Deletion Process

1. User clicks the delete button on a photo
2. A DELETE request is sent to the API
3. The photo is removed from the database
4. The UI is updated to remove the photo without page reload
5. If the deleted photo was the thumbnail, the car's thumbnail reference is cleared

## User Interface

The photo gallery is presented in a responsive grid format:
- 2 columns on small screens
- 3 columns on medium screens
- 4 columns on large screens

Photo size controls are provided:
- Small (S): Compact view for seeing more photos at once
- Medium (M): Default balanced size
- Large (L): Enlarged view for examining details

Each photo has:
- Rounded corners for a modern look
- Hover effects that reveal the edit, position, thumbnail, and delete buttons
- Subtle animations on hover
- Special highlighting if it's the selected thumbnail
- Custom positioning and zoom if set by the user

Photo management controls appear when hovering over an image:
- Edit button (pencil icon) - Allows replacing the image with a new one
- Position button (crop icon) - Opens the positioning interface
- Thumbnail button (image icon) - Sets the photo as the car's thumbnail
- Delete button (trash icon) - Removes the image from the system

## Adding New Photos

Photos can be added in two ways:
1. Through the "Upload photo" button at the top of the gallery
2. Through the "Upload first photo" button in the empty state

## Editing Photos

To edit a photo:
1. Hover over the image you want to edit
2. Click the pencil icon that appears
3. Select a new image from your device to replace the existing one
4. The system will automatically update the image while preserving its position in the gallery

## Positioning Photos

To adjust how a photo is displayed:
1. Hover over the image you want to position
2. Click the crop icon that appears
3. In the positioning modal:
   - Drag the photo to change its position within the frame
   - Use the zoom slider to enlarge or reduce the image
   - Click "Reset position" to return to default settings
4. Click "Save position" to apply the changes

## Setting a Thumbnail

To set a photo as the car's thumbnail:
1. Hover over the image you want to use as the thumbnail
2. Click the image icon that appears
3. The system will mark this photo as the thumbnail with a visual indicator
4. This photo will be used to represent the car in listings and tables

## Adjusting Photo Size

To change the size of photos in the gallery:
1. Use the S, M, L buttons at the top of the gallery
2. S shows smaller photos (more per row)
3. M is the default medium size
4. L shows larger photos (fewer per row, more detail)

## Error Handling

The system provides feedback for various error conditions:
- Invalid file types
- Upload failures
- Update/edit failures
- Position save failures
- Deletion failures
- Thumbnail setting failures

Error messages are displayed as toast notifications to provide clear feedback without disrupting the UI.

## Performance Considerations

1. **Size Limitations**:
   - Very large images may cause performance issues
   - Consider implementing server-side image compression for large uploads

2. **Loading Performance**:
   - The photos tab uses lazy loading to avoid fetching images until needed
   - Consider implementing pagination for vehicles with many photos

## Troubleshooting

If you encounter issues with photo management:

1. Check the browser console for error messages
2. Verify image file types (only JPEG, PNG, GIF, and WebP are supported)
3. Check database connection in the `.env` file
4. Ensure the browser has sufficient memory for image processing 