while ($true) {
    git add .
    git commit -m "auto update" --allow-empty
    git push origin main
    Start-Sleep -Seconds 10
}
