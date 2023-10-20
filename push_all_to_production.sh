
rsync -e 'ssh -p 1022' -avz public/ gocoho@gocoho.org:/home/gocoho/public_html/go_workday_kanban/

#reset permissions
ssh -i ~/.ssh/id_dsa -p 1022 gocoho@gocoho.org 'cd ~/public_html/go_workday_kanban/ && ~/bin/fix_web_perms.sh';


