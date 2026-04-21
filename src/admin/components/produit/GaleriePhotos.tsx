import { useState, useRef } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uploadImageGalerie, supprimerFichierStorage } from '@/lib/storageHelpers';

interface Photo {
  url: string;
  visible_site: boolean;
  nom: string;
  date_upload?: string;
}

interface Props {
  productRef: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

const MAX_PHOTOS = 6;

export default function GaleriePhotos({ productRef, photos, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleUploadPhotos = async (files: FileList) => {
    if (!productRef) {
      alert('⚠️ Enregistrez d\'abord le produit pour uploader des photos');
      return;
    }

    const filesArray = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      alert(`⚠️ Maximum ${MAX_PHOTOS} photos atteint.`);
      return;
    }

    const toUpload = filesArray.slice(0, remaining);
    if (toUpload.length < filesArray.length) {
      alert(`⚠️ Seules les ${remaining} premières photos seront uploadées.`);
    }

    setUploading(true);
    const nouvellesPhotos = [...photos];

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        setUploadProgress(`Upload ${i + 1}/${toUpload.length}`);

        const url = await uploadImageGalerie(productRef, file);
        nouvellesPhotos.push({
          url,
          visible_site: true,
          nom: file.name,
          date_upload: new Date().toISOString(),
        });
        onChange([...nouvellesPhotos]);
      }
    } catch (err: any) {
      alert('❌ Erreur upload : ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex(p => p.url === active.id);
    const newIndex = photos.findIndex(p => p.url === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(photos, oldIndex, newIndex));
  };

  const handleToggleVisible = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], visible_site: !newPhotos[index].visible_site };
    onChange(newPhotos);
  };

  const handleRemove = async (index: number) => {
    const photo = photos[index];
    if (!confirm('Supprimer cette photo ?')) return;

    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);

    try {
      await supprimerFichierStorage(photo.url);
    } catch (err) {
      console.warn('Erreur suppression Storage:', err);
    }
  };

  return (
    <>
      {photos.length > 0 && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map(p => p.url)} strategy={rectSortingStrategy}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}>
                {photos.map((photo, i) => (
                  <SortablePhoto
                    key={photo.url}
                    photo={photo}
                    position={i + 1}
                    onToggleVisible={() => handleToggleVisible(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>
            💡 Glissez-déposez pour réorganiser. Position 1 = affichée en premier sur le site.
          </div>
        </>
      )}

      {photos.length < MAX_PHOTOS && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading && e.dataTransfer.files.length > 0) {
              handleUploadPhotos(e.dataTransfer.files);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          style={{
            padding: 30,
            background: '#F9FAFB',
            border: '2px dashed #E5E7EB',
            borderRadius: 12,
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? (
            <>
              <div style={{ fontSize: 30, marginBottom: 6 }}>⏳</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {uploadProgress || 'Upload en cours...'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 30, color: '#9CA3AF', marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Glissez-déposez vos photos ici
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                ou cliquez pour parcourir — {photos.length}/{MAX_PHOTOS} photos · compression auto
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadPhotos(e.target.files);
          }
        }}
      />
    </>
  );
}

function SortablePhoto({
  photo, position, onToggleVisible, onRemove
}: {
  photo: Photo;
  position: number;
  onToggleVisible: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.url,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    aspectRatio: '1',
    background: '#F3F4F6',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    border: photo.visible_site ? '1px solid #E5E7EB' : '2px solid #FCA5A5',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <img
          src={photo.url}
          alt={photo.nom}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: photo.visible_site ? 1 : 0.4,
          }}
        />
      </div>

      {/* Badge position */}
      <div style={{
        position: 'absolute', top: 4, left: 4,
        background: 'rgba(30,58,95,0.9)', color: '#fff',
        width: 20, height: 20, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
      }}>{position}</div>

      {/* Bouton visible */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
        style={{
          position: 'absolute', bottom: 4, left: 4,
          background: photo.visible_site ? 'rgba(16,185,129,0.9)' : 'rgba(220,38,38,0.9)',
          color: '#fff', border: 'none',
          width: 22, height: 22, borderRadius: '50%',
          cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={photo.visible_site ? 'Visible sur le site' : 'Masqué du site'}
      >{photo.visible_site ? '👁' : '🔒'}</button>

      {/* Bouton supprimer */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          position: 'absolute', top: 4, right: 4,
          background: 'rgba(220,38,38,0.9)', color: '#fff',
          border: 'none', width: 22, height: 22, borderRadius: '50%',
          cursor: 'pointer', fontSize: 12, fontWeight: 700,
        }}
      >×</button>
    </div>
  );
}
