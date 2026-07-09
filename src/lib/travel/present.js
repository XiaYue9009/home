/** 旅行视频展示分组与筛选 */
import { collectGeoOptions, groupVideosByGeo } from '@/lib/travel/geo-extract.js';

export function groupVideosByFolderNames(videos, folderNames = []) {
  return folderNames.map((name) => {
    const matched = (videos || []).filter(
      (video) =>
        video.category === name ||
        video.folderName === name ||
        (name && video.folderName?.includes(name)),
    );

    const folderMap = new Map();
    for (const video of matched) {
      const folderName = video.folderName || name;
      const folderId = video.folderId || `folder-${folderName}`;
      if (!folderMap.has(folderId)) {
        folderMap.set(folderId, {
          id: folderId,
          name: folderName,
          total: 0,
          videos: [],
        });
      }
      const folder = folderMap.get(folderId);
      folder.videos.push(video);
      folder.total = folder.videos.length;
    }

    return {
      keyword: name,
      label: name,
      folders: [...folderMap.values()],
    };
  });
}

export function filterVideosByGeo(videos, filters = {}) {
  const { province, city, district, placeName } = filters;
  return (videos || []).filter((video) => {
    if (province && video.province !== province) return false;
    if (city && video.city !== city) return false;
    if (district && video.district !== district) return false;
    if (placeName && video.placeName !== placeName) return false;
    return true;
  });
}

export function buildTravelGeoView(videos, filters = {}) {
  const filtered = filterVideosByGeo(videos, filters);
  return {
    filteredVideos: filtered,
    geoGroups: groupVideosByGeo(filtered),
    geoOptions: collectGeoOptions(videos),
  };
}

export function flattenDouyinGroups(groups = []) {
  const videos = [];
  for (const group of groups) {
    for (const folder of group.folders || []) {
      for (const video of folder.videos || []) {
        videos.push({
          ...video,
          folderId: video.folderId || folder.id,
          folderName: video.folderName || folder.name,
          category: video.category || group.keyword || folder.name,
        });
      }
    }
  }
  return videos;
}
