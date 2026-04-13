## Tarium-BD – Manual Endpoint Testing

Todas las peticiones autenticadas usan un JWT de Supabase en el header `Authorization: Bearer <token>`.

Sustituye:
- `<PORT>` por el puerto del backend (por defecto `3001`).
- `<TOKEN>` por un access token válido de Supabase.

### Health Check

```bash
curl http://localhost:<PORT>/health
```

### YouTube Proxy

Search:

```bash
curl "http://localhost:<PORT>/api/youtube/search?q=daft+punk"
```

Metadata (enriquecimiento):

```bash
curl "http://localhost:<PORT>/api/youtube/metadata?title=Around+the+World&artist=Daft+Punk"
```

Requiere `YOUTUBE_API_KEY` configurada en Render / entorno local.

### Playlists (autenticado)

Listar playlists del usuario:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/playlists
```

Crear playlist:

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Mi Playlist"}' \
  http://localhost:<PORT>/api/playlists
```

Renombrar playlist:

```bash
curl -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Nuevo Nombre"}' \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>
```

Obtener tracks de una playlist:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>/tracks
```

Agregar track a playlist:

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "track_id":"local-123",
    "title":"Canción",
    "artist":"Artista",
    "thumbnail_url":"https://example.com/cover.jpg",
    "duration_seconds":210
  }' \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>/tracks
```

Reordenar tracks de una playlist:

1. Primero obtén los tracks y sus `id`:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>/tracks
```

2. Luego envía el nuevo orden completo (array con TODOS los ids, sin duplicados):

```bash
curl -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"trackIds":["<TRACK_ID_2>","<TRACK_ID_1>","<TRACK_ID_3>"]}' \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>/tracks/reorder
```

Eliminar track de una playlist:

```bash
curl -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>/tracks/<TRACK_ROW_ID>
```

Eliminar playlist:

```bash
curl -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/playlists/<PLAYLIST_ID>
```

### Favoritos (autenticado)

Listar favoritos:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/favorites
```

Agregar favorito:

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "track_id":"local-123",
    "title":"Canción",
    "artist":"Artista",
    "thumbnail_url":"https://example.com/cover.jpg"
  }' \
  http://localhost:<PORT>/api/favorites
```

Eliminar favorito por track_id:

```bash
curl -X DELETE -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/favorites/local-123
```

### Historial (autenticado)

Registrar reproducción:

```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "track_id":"local-123",
    "title":"Canción",
    "artist":"Artista",
    "album":"Álbum opcional",
    "thumbnail_url":"https://example.com/cover.jpg",
    "duration_seconds":210
  }' \
  http://localhost:<PORT>/api/history/play
```

Últimos reproducidos:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/history/recent
```

Más escuchados:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:<PORT>/api/history/top
```
