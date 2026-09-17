param([string]$src,[string]$dst,[int]$x,[int]$y,[int]$w,[int]$h,[int]$outW,[int]$quality)
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Image]::FromFile($src)
$outH=[int]([math]::Round($h * $outW / $w))
$out=New-Object System.Drawing.Bitmap $outW,$outH
$g=[System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($img,(New-Object System.Drawing.Rectangle 0,0,$outW,$outH),(New-Object System.Drawing.Rectangle $x,$y,$w,$h),[System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep=New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),([long]$quality)
$out.Save($dst,$codec,$ep)
$out.Dispose(); $img.Dispose()
Write-Output ("{0}  {1}x{2}  {3:N0} KB" -f (Split-Path $dst -Leaf),$outW,$outH,((Get-Item $dst).Length/1KB))
