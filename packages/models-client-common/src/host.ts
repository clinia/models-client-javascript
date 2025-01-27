export type HostScheme = 'http' | 'https';

export type Host = {
  Url: string;
  Scheme: HostScheme;
  Port?: number;
};

export const hostFullUrl = (host: Host): string => {
  if (host.Port === undefined) {
    return `${host.Scheme}://${host.Url}`;
  }

  return `${host.Scheme}://${host.Url}:${host.Port}`;
};
