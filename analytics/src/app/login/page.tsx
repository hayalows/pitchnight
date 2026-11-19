import { authConfigured } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{reason?:string}>}) {
  const params=await searchParams;
  const configured=authConfigured();
  const error=params.reason==="rate"?"Too many attempts. Try again later.":
    params.reason==="invalid"?"That password wasn't accepted. Try again.":null;
  return <main className="loginWrap">
    <div className="loginMark" aria-hidden="true"><span>O</span></div>
    <p className="eyebrow">OFFSCRIPT / PRIVATE REPORTING</p>
    <h1 className="loginTitle">See what&apos;s<br/>happening<span>.</span></h1>
    <p className="loginIntro">Site visits, event interest, and audience activity in one place.</p>
    <section className="loginPanel" aria-labelledby="loginLabel">
      <h2 id="loginLabel">Organiser sign in</h2>
      {configured ?
        <form action="/analytics/api/auth" method="post">
          <label htmlFor="password">Access password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={1} required placeholder="Your organiser password"/>
          {error&&<p className="formError" role="alert">{error}</p>}
          <button className="primaryButton" type="submit">Open dashboard <span aria-hidden="true">↗</span></button>
        </form>
      :<p role="status" className="formNote">Private reporting is not configured yet. Set the database and organiser credentials before opening access.</p>}
    </section>
    <p className="loginBottom">OFFSCRIPT · BEYOND THE USUAL</p>
  </main>;
}
