#!/usr/bin/python3


import random
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from matplotlib import backends
from matplotlib.backends import backend_pdf
from matplotlib import rcParams
from matplotlib import colors
import scipy.special as spsp
import math
import scipy.optimize as spopt
matplotlib.rcParams.update(matplotlib.rcParamsDefault)
rcParams['text.usetex'] = True
rcParams['font.family'] = 'serif'
rcParams['font.sans-serif'] = ['CMU Serif']
rcParams['font.serif'] = ['CMU Serif']
plt.rc('text.latex', preamble=r'\usepackage{amsmath}\usepackage{amssymb}')

##### DATA ######






###### PLOT ######
def plot():
	outPDF = 'figure1.pdf'
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=16)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=14)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, ax = plt.subplots(nrows=1, ncols=1, sharex='col')
 
		



		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")

plot()




