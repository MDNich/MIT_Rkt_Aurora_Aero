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
from matplotlib import cm
import scipy.special as spsp
import math
import scipy.optimize as spopt
matplotlib.rcParams.update(matplotlib.rcParamsDefault)
rcParams['text.usetex'] = True
rcParams['font.family'] = 'serif'
rcParams['font.sans-serif'] = ['CMU Serif']
rcParams['font.serif'] = ['CMU Serif']
plt.rc('text.latex', preamble=r'\usepackage{amsmath}\usepackage{amssymb}')

alph = 0.4

pathN = "../../dat/ansys/new_m1.csv"
pathO = "../../dat/ansys/old_m1.csv"

rawN = np.loadtxt(pathN,dtype='str',delimiter=',')
rawO = np.loadtxt(pathO,dtype='str',delimiter=',')
#print(rawN[0])

for i in range(len(rawN[0])):
	print(str(i) + ": " + str(rawN[0][i]))

rawN_T = np.transpose(rawN)
rawO_T = np.transpose(rawO)

cmapp = 'inferno'


def plotShear():
	outPDF = '../out/figure2_shear_3D.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig = plt.figure(figsize=(8, 4.7))

		dataset = rawN_T
		
		varLabel = 'Shear (kPa)'

		a = 121
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	
		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		
		max0 = (np.ceil(np.max(varToPlot)/100)*100)*1e-3
		n = matplotlib.colors.Normalize(0, max0)
		scaleF = np.max(varToPlot)/max0

		fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.plot_trisurf(y,-x,z,color='k')
		ax.scatter(y,-x,z,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Aurora")

		ax.set_box_aspect((5,7,2))








		dataset = rawO_T


		a = 122
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	

		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		scaleF = np.max(varToPlot)/max0
		
		fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.plot_trisurf(x,-z,y,color='k')
		ax.scatter(x,-z,y,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Prometheus")

		ax.set_box_aspect((5,7,2))
		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")


def plotPressure(which='Total'):
	outPDF = '../out/figure2_pressure_' + which + '_3D.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig = plt.figure(figsize=(8, 4.7))

		dataset = rawN_T
		
		varLabel = 'Pressure ({}) (kPa)'.format(which)

		a = 121
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		pTot = np.array(dataset[8][1:],dtype='float')
		pDyn = np.array(dataset[6][1:],dtype='float')
		pAbs = np.array(dataset[7][1:],dtype='float')
		
		varToPlot = pTot if which == 'Total' else (pDyn if which == 'Dynamic' else pAbs)
		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		
		max0 = (np.ceil(np.max(varToPlot)/100)*100)*1e-3 if which != 'Abs' else 200
		n = matplotlib.colors.Normalize(0, max0)
		scaleF = np.max(varToPlot)/max0

		fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=40)
		
		ax.plot_trisurf(y,-x,z,color='k')
		ax.scatter(y,-x,z,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Aurora")

		ax.set_box_aspect((5,7,2))








		dataset = rawO_T


		a = 122
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		pTot = np.array(dataset[8][1:],dtype='float')
		pDyn = np.array(dataset[6][1:],dtype='float')
		pAbs = np.array(dataset[7][1:],dtype='float')
		
		varToPlot = pTot if which == 'Total' else (pDyn if which == 'Dynamic' else pAbs)

		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())

		
		fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=40)
		
		ax.plot_trisurf(x,-z,y,color='k')
		scaleF = np.max(varToPlot)/max0
		ax.scatter(x,-z,y,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Prometheus")

		ax.set_box_aspect((5,7,2))
		#plt.show()
		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")

def plotMesh():
	outPDF = '../out/figure2_mesh_3D.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig = plt.figure(figsize=(8, 4.7))

		dataset = rawN_T
		
		varLabel = ''

		a = 121
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	
		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		
		max0 = (np.ceil(np.max(varToPlot)/100)*100)*1e-3
		n = matplotlib.colors.Normalize(0, max0)
		scaleF = np.max(varToPlot)/max0

		#fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		#             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.plot_trisurf(y,-x,z,color='r',alpha=0.9)
		#ax.scatter(y,-x,z,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Aurora")

		ax.set_box_aspect((5,7,2))








		dataset = rawO_T


		a = 122
		ax = fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	

		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		scaleF = np.max(varToPlot)/max0
		
		#fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		#             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.plot_trisurf(x,-z,y,color='r',alpha=0.9)
		#ax.scatter(x,-z,y,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		plt.gca().set_title("Prometheus")

		ax.set_box_aspect((5,7,2))
		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")

def plotMesh2D():
	outPDF = '../out/figure2_mesh_2D.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, axs = plt.subplots(ncols=2,nrows=1,figsize=(15, 3))

		dataset = rawN_T
		
		varLabel = ''

		a = 121
		ax = axs[0]
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	
		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		
		max0 = (np.ceil(np.max(varToPlot)/100)*100)*1e-3
		n = matplotlib.colors.Normalize(0, max0)
		scaleF = np.max(varToPlot)/max0

		#fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		#             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.scatter(y,z-np.min(z),color='r',alpha=0.4)
		ax.set_xlim(-4,4)
		#ax.scatter(y,-x,z,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)

		ax.set_title("Aurora")

		#ax.set_box_aspect((5,7,2))








		dataset = rawO_T


		#a = 122
		ax = axs[1]#fig.add_subplot(a,projection='3d')
		x = np.array(dataset[1][1:],dtype='float')*100
		y = np.array(dataset[2][1:],dtype='float')*100
		z = np.array(dataset[3][1:],dtype='float')*100

		shear = np.array(dataset[53][1:],dtype='float')
		varToPlot = shear	

		df_describe = pd.DataFrame(varToPlot)
		print(df_describe.describe())
		scaleF = np.max(varToPlot)/max0
		
		#fig.colorbar(matplotlib.cm.ScalarMappable(norm=n, cmap=cmapp),
		#             ax=ax, orientation='horizontal', label=varLabel,pad=0.1,location='bottom',shrink=0.6,aspect=30)
		
		ax.scatter(x,y-np.min(y),color='r',alpha=0.4)
		#ax.scatter(x,-z,y,alpha=alph,c=varToPlot*scaleF,s=7,cmap=cmapp)
		ax.set_xlim(-4,4)

		ax.set_title("Prometheus")

		#ax.set_box_aspect((5,7,2))
		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")




#plotShear()
#plotPressure('Dynamic')
#plotPressure('Total')
#plotPressure('Abs')

plotMesh2D()