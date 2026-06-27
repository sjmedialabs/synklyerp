export type FeatureTreeNode = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  menuType: string;
  moduleKey: string | null;
  parentId: string | null;
  sortOrder: number;
  children: FeatureTreeNode[];
};

export type CategoryFeatureAssignment = {
  menuId: string;
  menuSlug: string;
  isEnabled: boolean;
};
