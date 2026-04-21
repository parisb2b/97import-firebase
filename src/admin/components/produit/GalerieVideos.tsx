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
import {
  uploadVideoProduit,
  uploadVideoThumbnail,
  extraireThumbnailVideo,
  supprimerFichierStorage
} from '@/lib/storageHelpers';

interface Video {
  url: string;
  visible_site: boolean;
  nom: string;
  taille_mo: number;
  duree_sec?: number;
  thumbnail_url?: string;
  date_upload?: string;
}

interface Props {
  productRef: string;
  videos: Video[];
  onChange: (videos: Video[]) => void;
}

const MAX_VIDEOS = 6;
const AVERTISSEMENT_TAILLE_MO = 200;

export default function GalerieVideos({ productRef, videos, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleUploadVideos = async (files: FileList) => {
    if (!productRef) {
      alert('⚠️ Enregistrez d\'abord le produit pour uploader des vidéos');
      return;
    }

    const filesArray = Array.from(files);
    const remaining = MAX_VIDEOS - videos.length;

    if (remaining <= 0) {
      alert(`⚠️ Maximum ${MAX_VIDEOS} vidéos atteint. Supprimez-en avant d'en ajouter.`);
      return;
    }

    const toUpload = filesArray.slice(0, remaining);
    if (toUpload.length < filesArray.length) {
      alert(`⚠️ Seules les ${remaining} premières vidéos seront uploadées (limite ${MAX_VIDEOS}).`);
    }

    // Vérification taille et demande confirmation si grosse vidéo
    for (const file of toUpload) {
      const tailleMo = file.size / 1024 / 1024;
      if (tailleMo > AVERTISSEMENT_TAILLE_MO) {
        const confirmed = confirm(
          `⚠️ La vidéo "${file.name}" fait ${tailleMo.toFixed(0)} Mo.\n\n` +
          `Coût Firebase Storage estimé :\n` +
          `• Stockage : ~${(tailleMo * 0.026 / 1024).toFixed(3)} $/mois\n` +
          `• Bande passante : ~${(tailleMo * 0.12 / 1024).toFixed(2)} $ par 1000 vues\n\n` +
          `Continuer l'upload ?`
        );
        if (!confirmed) return;
      }
    }

    setUploading(true);
    const nouvellesVideos = [...videos];

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        setUploadProgress(`Upload ${i + 1}/${toUpload.length} : ${file.name}`);

        // 1. Extraire thumbnail et durée
        let thumbnailUrl: string | undefined;
        let dureeSec: number | undefined;
        try {
          const { thumbnailBlob, duree_sec } = await extraireThumbnailVideo(file);
          dureeSec = duree_sec;
          thumbnailUrl = await uploadVideoThumbnail(productRef, file.name, thumbnailBlob);
        } catch (err) {
          console.warn('Extraction thumbnail échouée pour', file.name, err);
          // Pas bloquant, on continue sans thumbnail
        }

        // 2. Upload vidéo
        const url = await uploadVideoProduit(productRef, file);

        // 3. Ajouter à la galerie
        nouvellesVideos.push({
          url,
          visible_site: true,  // Default: visible
          nom: file.name,
          taille_mo: parseFloat((file.size / 1024 / 1024).toFixed(2)),
          duree_sec: dureeSec,
          thumbnail_url: thumbnailUrl,
          date_upload: new Date().toISOString(),
        });

        onChange([...nouvellesVideos]);
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
    const oldIndex = videos.findIndex(v => v.url === active.id);
    const newIndex = videos.findIndex(v => v.url === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(videos, oldIndex, newIndex));
  };

  const handleToggleVisible = (index: number) => {
    const newVideos = [...videos];
    newVideos[index] = {
      ...newVideos[index],
      visible_site: !newVideos[index].visible_site,
    };
    onChange(newVideos);
  };

  const handleRemove = async (index: number) => {
    const video = videos[index];
    if (!confirm(`Supprimer définitivement la vidéo "${video.nom}" ?\n\nCette action est irréversible.`)) return;

    const newVideos = videos.filter((_, i) => i !== index);
    onChange(newVideos);

    // Suppression Firebase Storage (vidéo + thumbnail)
    try {
      await supprimerFichierStorage(video.url);
      if (video.thumbnail_url) {
        await supprimerFichierStorage(video.thumbnail_url);
      }
    } catch (err) {
      console.warn('Erreur suppression Storage:', err);
    }
  };

  return (
    <>
      {videos.length > 0 ? (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map(v => v.url)} strategy={rectSortingStrategy}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 12,
              }}>
                {videos.map((video, i) => (
                  <SortableVideo
                    key={video.url}
                    video={video}
                    position={i + 1}
                    onToggleVisible={() => handleToggleVisible(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            💡 Glissez-déposez pour réorganiser. Position 1 = affichée en premier sur le site.
          </div>
        </>
      ) : null}

      {/* Zone d'upload */}
      {videos.length < MAX_VIDEOS && (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            if (!uploading && e.dataTransfer.files.length > 0) {
              handleUploadVideos(e.dataTransfer.files);
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
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                {uploadProgress || 'Upload en cours...'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                Extraction thumbnail et upload Firebase
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 30, color: '#9CA3AF', marginBottom: 6 }}>🎬</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Glissez-déposez vos vidéos MP4 ici
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                ou cliquez pour parcourir — {videos.length}/{MAX_VIDEOS} vidéos
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>
                Thumbnail auto à 1s · Compression conseillée pour &lt; 50 Mo · Avertissement si &gt; {AVERTISSEMENT_TAILLE_MO} Mo
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadVideos(e.target.files);
          }
        }}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// Composant vidéo sortable (drag & drop)
// ═══════════════════════════════════════════════════════

function SortableVideo({
  video, position, onToggleVisible, onRemove
}: {
  video: Video;
  position: number;
  onToggleVisible: () => void;
  onRemove: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.url,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    border: video.visible_site ? '1px solid #E5E7EB' : '2px solid #FCA5A5',
    position: 'relative',
  };

  const formatDuree = (sec?: number) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Thumbnail avec overlay drag */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          background: '#000',
          cursor: 'grab',
          overflow: 'hidden',
        }}
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.nom}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: video.visible_site ? 1 : 0.4,
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            fontSize: 30,
          }}>🎬</div>
        )}

        {/* Badge position */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'rgba(30,58,95,0.9)', color: '#fff',
          width: 24, height: 24, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
        }}>{position}</div>

        {/* Badge privé si masqué */}
        {!video.visible_site && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: '#DC2626', color: '#fff',
            padding: '2px 8px', borderRadius: 10,
            fontSize: 10, fontWeight: 700,
          }}>🔒 Privé</div>
        )}

        {/* Durée */}
        {video.duree_sec && (
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            padding: '2px 6px', borderRadius: 4,
            fontSize: 10, fontWeight: 600,
          }}>{formatDuree(video.duree_sec)}</div>
        )}

        {/* Bouton Play preview */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(234,88,12,0.9)', color: '#fff',
            border: 'none', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >▶</button>
      </div>

      {/* Infos vidéo */}
      <div style={{ padding: 10 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: '#374151',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>{video.nom}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 8 }}>
          {video.taille_mo} Mo {video.duree_sec && `· ${formatDuree(video.duree_sec)}`}
        </div>

        {/* Toggle visible + supprimer */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 4,
            flex: 1, cursor: 'pointer', fontSize: 11,
            color: video.visible_site ? '#059669' : '#6B7280',
            fontWeight: 500,
          }}>
            <input
              type="checkbox"
              checked={video.visible_site}
              onChange={onToggleVisible}
              style={{ accentColor: '#EA580C', cursor: 'pointer' }}
            />
            {video.visible_site ? '👁 Public' : '🔒 Privé'}
          </label>
          <button
            onClick={onRemove}
            style={{
              background: 'transparent',
              border: '1px solid #FECACA',
              color: '#DC2626',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >🗑</button>
        </div>
      </div>

      {/* Modal preview vidéo */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh' }}>
            <video
              src={video.url}
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }}
            />
            <div style={{ color: '#fff', textAlign: 'center', marginTop: 12, fontSize: 13 }}>
              {video.nom} — Cliquez hors de la vidéo pour fermer
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
