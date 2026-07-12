import { NextResponse, type NextRequest } from "next/server";

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER ?? "xeno205";
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD ?? "togethervc205";

function getCredentials(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  try {
    return atob(authorization.slice("Basic ".length));
  } catch {
    return null;
  }
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PitchSnitch"',
    },
  });
}

export function proxy(request: NextRequest) {
  const credentials = getCredentials(request.headers.get("authorization"));

  if (credentials === `${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
