from flask import Flask, render_template, redirect, url_for
import webbrowser
import threading

app = Flask(__name__)

# 用户角色判断（简单示例，实际项目中需要更复杂的用户认证系统）
def is_admin(user):
    return user == 'admin'

@app.route('/')
def index():
    return render_template('main_info.html')

@app.route('/admin_ctrl')
def admin_ctrl():
    user = 'admin'  # 假设当前用户是管理员
    if is_admin(user):
        return render_template('admin_ctrl.html')
    else:
        return redirect(url_for('index'))  # 使用url_for来重定向

@app.route('/water_system')
def water_system():
    return render_template('water_system.html')

@app.route('/smart_center')
def smart_center():
    return render_template('smart_center.html')

@app.route('/data_center')
def data_center():
    return render_template('data_center.html')

@app.route('/main_info')
def main_info():
    return render_template('main_info.html')

def open_browser():
    webbrowser.open('http://127.0.0.1:5000/main_info')

if __name__ == '__main__':
    # 打开浏览器
    open_browser()
    # 运行 Flask 应用
    app.run(debug=True, use_reloader=False)