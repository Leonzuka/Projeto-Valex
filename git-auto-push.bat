@echo off
echo Atualizando repositório Git...
git add .
git commit -m "Auto-commit: %date% %time%"
git push
echo Atualização concluída!
pause