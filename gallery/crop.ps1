param([string]$src,[string]$dst,[int]$x,[int]$y,[int]$w,[int]$h,[double]$scale=1.0)
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Image]::FromFile($src)
$rect=New-Object System.Drawing.Rectangle $x,$y,$w,$h
$bmp=New-Object System.Drawing.Bitmap $w,$h
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img,(New-Object System.Drawing.Rectangle 0,0,$w,$h),$rect,[System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$ow=[int]($w*$scale); $oh=[int]($h*$scale)
$out=New-Object System.Drawing.Bitmap $ow,$oh
$g2=[System.Drawing.Graphics]::FromImage($out)
$g2.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g2.DrawImage($bmp,0,0,$ow,$oh)
$g2.Dispose()
$out.Save($dst,[System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose(); $bmp.Dispose(); $img.Dispose()
Write-Output "$dst ${ow}x${oh}"
