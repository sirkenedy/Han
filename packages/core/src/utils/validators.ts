export const validateGitHubWebhook = (payload: any): boolean => {
  return !!(payload?.repository?.clone_url && payload?.repository?.name);
};

export const validatePort = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
};

export const validateDomain = (domain: string): boolean => {
  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
};

export const validateRepository = (repo: string): boolean => {
  const repoRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  return repoRegex.test(repo);
};
