export const extractStyles = (s: string) => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(s, "text/html")
  console.log(parsed.children);

    // "<a href="https://matrix.to/#/!HqBdAJXpRQsKVFnAqI:envs.net/$InkoQB22fj0_4_i-537OnOA6jowcsAQTFUCumKFXOKc?via=envs.net&via=linuxistcool.de">
    // In reply to
    // </a> <a href="https://matrix.to/#/@m:linuxistcool.de">@m:linuxistcool.de</a>
    // <br>I studied and got a job as a student"
}
