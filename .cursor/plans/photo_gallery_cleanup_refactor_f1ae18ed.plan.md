---
name: Photo gallery cleanup refactor
overview: Remove redundant size controls from AutoDetail and PhotoGallery, switch to a responsive grid with fixed aspect ratio for photo cards, and apply standard shadcn TabsList styling. All existing interactions (fullscreen, hover overlay, set-thumbnail button) are preserved.
todos: []
isProject: false
---

# Photo Gallery Cleanup Refactor

## 1. AutoDetail.tsx

**File:** [src/components/dashboard/AutoDetail.tsx](src/components/dashboard/AutoDetail.tsx)

### Remove S/M/L size controls and related code

- **Delete** the entire block that renders the S/M/L buttons (lines 675-706): the `<div className="flex items-center border rounded-md overflow-hidden">` and the three `<Button>` elements with "S", "M", "L" and `onClick={() => setPhotoSize(...)}`.
- **Remove** the `photoSize` state (line 99):  
`const [photoSize, setPhotoSize] = useState<'small' | 'medium' | 'large'>('medium')`.
- **Remove** the `getPhotoHeight` function (lines 450-458); it is only defined and never called, so safe to delete.
- **Clean up imports:** Remove `Image as ImageIcon` from the lucide-react import (line 17) if it is only used by the S/M/L buttons. Keep `Image` from `next/image` if it is used elsewhere; otherwise remove that import too. (Current usage: ImageIcon only in the three size buttons; next/image `Image` is not used in this file, so both can be removed.)

### Keep upload and align header

- **Keep** the two hidden `<input type="file">` elements (photo-upload, photo-edit) and the "Nahrát fotografii" `<Button>` exactly as they are.
- **Layout:** In the photos tab header (lines 671-733), after removing the S/M/L block, keep a single row with the title "Fotogalerie" on the left and the upload button on the right. Use existing flex layout, e.g. `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`, and put only the file inputs + the upload Button in the right-side div so the button is cleanly aligned to the right.

### TabsList styling

- **Current:** `TabsList` uses `className="w-full flex flex-wrap gap-2"` (line 557), which overrides the default shadcn look.
- **Change:** Use the standard shadcn TabsList appearance by applying the default classes from [src/components/ui/tabs.tsx](src/components/ui/tabs.tsx) (inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground) and only add what is needed for layout. For example:  
`className="w-full inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1"`  
so the tabs look like the rest of the app (muted background, pill-style triggers) instead of a plain flex row. Keep `TabsTrigger` classes as-is or minimal (e.g. `text-sm` only if desired).

---

## 2. PhotoGallery.tsx

**File:** [src/components/dashboard/PhotoGallery.tsx](src/components/dashboard/PhotoGallery.tsx)

### Remove size controls and state

- **Delete** the top toolbar (lines 121-146): the `<div className="flex justify-between items-center">` that contains the three buttons "Malé", "Střední", "Velké".
- **Remove** state: `const [photoSize, setPhotoSize] = useState<'small' | 'medium' | 'large'>('medium')` (line 30).
- **Remove** the `getPhotoSizeClass()` function (lines 112-118).

### Responsive grid and card layout

- **Grid:** Replace the current grid classes with the specified responsive grid:  
`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`.
- **Card wrapper:** For each photo card, use a fixed aspect ratio instead of height from `getPhotoSizeClass()`. Apply `aspect-[4/3]` (or `aspect-video` if you prefer 16:9) to the **inner** wrapper that contains the image so all cards are uniform. Suggested structure:
  - Outer card div: keep `relative group rounded-lg overflow-hidden border shadow-sm ... bg-muted/20` and `onClick={() => setFullscreenPhoto(photo)}`.
  - Inner wrapper: replace the current `relative flex items-center justify-center ${getPhotoSizeClass()}` with a fixed-aspect container, e.g. `relative aspect-[4/3] w-full`.
  - Image: use `object-cover` so the image fills the aspect box (cropping if needed). Classes: `absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105`. This keeps a uniform, professional look.

### Preserve all interactions

- **Card click:** Keep `onClick={() => setFullscreenPhoto(photo)}` on the outer card div.
- **Hover overlay:** Keep the overlay with Pencil, ImageIcon (set thumbnail), and Trash buttons; ensure it stays `absolute inset-0` over the new aspect box.
- **Bottom-right Button:** Keep the absolute positioned Button with `ImageIcon` that calls `handleSetThumbnail(photo.id)` (lines 211-221).
- **Thumbnail badge:** Keep the "Miniatura" badge for `photo.id === thumbnailId`.
- **Empty state and PhotoEditor / fullscreen:** No changes; leave as-is.

---

## 3. Summary


| File             | Removals                                                                                                                   | Additions / changes                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| AutoDetail.tsx   | S/M/L buttons block; `photoSize` state; `getPhotoHeight()`; lucide `Image as ImageIcon` (and next/image `Image` if unused) | TabsList: standard shadcn classes; header: only title left, upload right                                                               |
| PhotoGallery.tsx | "Malé / Střední / Velké" toolbar; `photoSize` state; `getPhotoSizeClass()`                                                 | Grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`; card inner: `aspect-[4/3]`; image: `object-cover` + absolute inset-0 |


---

## 4. Constraints checklist

- Tailwind only; no new CSS files.
- Client components unchanged; no logic changes to `handlePhotoUpload`, `handleSetThumbnail`, or delete handlers.
- Czech UI texts preserved; variables/comments in English.
- All existing photo actions (fullscreen, edit, set thumbnail, delete) remain working.

