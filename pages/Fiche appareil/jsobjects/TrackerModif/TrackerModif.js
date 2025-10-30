export default {
	setModifiedTrue: () => {
    storeValue("modified", true);
  },
  resetModified: () => {
    storeValue("modified", false);
  },
  isModified: () => {
    return appsmith.store.modified;
  }
}