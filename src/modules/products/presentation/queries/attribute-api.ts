export interface AttributeOptionApi {
  id: string;
  value: string;
  attributeId: string;
}

export interface AttributeWithOptionsApi {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  options: AttributeOptionApi[];
}

interface ApiErrorResponse {
  error: string;
}

export interface ApiRequestError {
  status: number;
  value: ApiErrorResponse;
}

function buildQueryString(filters?: { search?: string }): string {
  if (!filters?.search) {
    return "";
  }

  const query = new URLSearchParams({ search: filters.search });
  return `?${query.toString()}`;
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    const json = (await response.json()) as Partial<ApiErrorResponse>;
    if (typeof json.error === "string" && json.error.length > 0) {
      return { error: json.error };
    }
  } catch {
    // Fall through to generic message.
  }

  return { error: "Request failed" };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/products/attributes${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const value = await parseErrorResponse(response);
    throw {
      status: response.status,
      value,
    } satisfies ApiRequestError;
  }

  return (await response.json()) as T;
}

export const attributeApi = {
  list(filters?: { search?: string }) {
    return requestJson<AttributeWithOptionsApi[]>(`${buildQueryString(filters)}`);
  },
  get(id: string) {
    return requestJson<AttributeWithOptionsApi>(`/${id}`);
  },
  create(body: { name: string }) {
    return requestJson<{ id: string; name: string }>("", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: { name: string }) {
    return requestJson<{ id: string; name: string }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  delete(id: string) {
    return requestJson<{ success: true }>(`/${id}`, { method: "DELETE" });
  },
  createOption(attributeId: string, body: { value: string }) {
    return requestJson<{ id: string; value: string; attributeId: string }>(
      `/${attributeId}/options`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },
  updateOption(attributeId: string, id: string, body: { value: string }) {
    return requestJson<{ id: string; value: string; attributeId: string }>(
      `/${attributeId}/options/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  },
  deleteOption(attributeId: string, id: string) {
    return requestJson<{ success: true }>(`/${attributeId}/options/${id}`, {
      method: "DELETE",
    });
  },
};
