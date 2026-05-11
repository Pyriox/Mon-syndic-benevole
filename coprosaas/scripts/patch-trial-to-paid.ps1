$p = "F:\Syndic-Bénévole\coprosaas\src\lib\emails\subscription.ts"
$bytes2 = [System.IO.File]::ReadAllBytes($p)
$text = [System.Text.Encoding]::UTF8.GetString($bytes2)

$oldStart = $text.IndexOf("  const content = ``" + "`n<h1 style=`"margin:0 0 6px;font-size:20px;font-weight:700;color:`${COLOR.text}`">Votre abonnement commence</h1>")
Write-Host "Start index: $oldStart"

# Find the old block by searching for the function end marker
$funcStart = $text.IndexOf("export function buildTrialToPaidEmail")
$nextFunc = $text.IndexOf("`n// ", $funcStart + 10)
Write-Host "Function start: $funcStart, Next section: $nextFunc"

$oldBlock = $text.Substring($funcStart, $nextFunc - $funcStart)
Write-Host "Old block length: $($oldBlock.Length)"
Write-Host "--- OLD BLOCK START ---"
$oldBlock.Substring(0, 200)
