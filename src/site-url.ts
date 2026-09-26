import { createHash } from "node:crypto";

type BuildEnvironment = {
  WORKERS_CI?: string;
  WORKERS_CI_BRANCH?: string;
};

const productionSite = "https://storarri.family";

export function getSiteUrl(environment: BuildEnvironment): string {
  const branch = environment.WORKERS_CI_BRANCH;
  const isPreview = environment.WORKERS_CI === "1" && branch !== "main";
  if (!isPreview) {
    return productionSite;
  }

  const previewAlias = getPreviewAlias(branch);
  return `https://${previewAlias}-home.storarri-family.workers.dev`;
}

function getPreviewAlias(branch?: string): string {
  if (!branch) return "staging";

  const sanitizedBranch = branch
    ?.replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  if (sanitizedBranch.length <= 58) return sanitizedBranch;

  const branchSha256Hash = createHash("sha256")
    .update(branch ?? "")
    .digest("hex")
    .slice(0, 4);
  return `${sanitizedBranch.slice(0, 53)}-${branchSha256Hash}`;
}
